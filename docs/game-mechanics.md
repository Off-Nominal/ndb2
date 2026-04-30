# NDB2 game mechanics (overview)

**NDB2** (Nostradambot 2) is a **public predictions game**: players predict real-world outcomes—often space-industry themed (launches, milestones like Mars landing, and similar topics)—and **gain or lose points** when predictions are judged **successful** or **failed**.

This document focuses on **domain concepts and prediction lifecycle**, including how they map to the PostgreSQL schema and background monitors. **Scoring formulas**, **wagers**, **ratios**, and **seasons** are in [`scoring.md`](scoring.md). **Leaderboards / aggregation** can be documented separately if needed.

---

## Background monitors and timing

Several steps run on **cron schedules** defined as `MonitorConfig` entries under **`app/src/domain`** (for example `app/src/domain/predictions/config.ts` for prediction lifecycle jobs, and `app/src/domain/seasons/config.ts` for season-related jobs). Exact cron strings live in those files.

**“Business hours” (UTC):** **Trigger Check**, **Snooze Check**, and **Unactioned Snooze Check** are restricted to daytime slots **12:00–21:59 UTC** (half-hourly offsets per monitor) so automated game events are less likely to fire in the middle of the night for players. **Judgement Check** runs **every 10 minutes, 24/7** (`*/10 * * * *`).

**Stateless workers:** Close and judgement logic **re-queries** the database each run (e.g. “next prediction to judge” where `triggered_date` is old enough). If the app is down for an hour, the next successful run still picks up every eligible row—nothing is “missed” because of a missed single firing.

**“About 24 hours” before judgement:** Code treats a closed prediction as ready to judge when **`triggered_date` is more than one day in the past**. In practice that is **at least ~24 hours** after close; it can be **longer** (downtime, cron alignment, or waiting for the next monitor tick). The voting window is described in product terms as roughly a day, not a stopwatch.

**Date-driven close:** Automatic close runs on the same **business-hours** schedules as the trigger monitor, so **`due_date`** may pass slightly before the row is actually **closed**—same idea as judgement: **eventually** consistent, not instant.

---

## Core entities

### Users

Players are stored in **`users`** (primary key `id` UUID, `discord_id` for identity in Discord-integrated flows).

### Predictions

A **prediction** is a row in **`predictions`**:

| Concept | Schema / API |
|--------|----------------|
| Predictor (author) | Column **`user_id`** (FK to `users`). API responses expose this as **`predictor.id`** (see prediction queries that alias `p.user_id AS predictor_id`). |
| Natural-language claim | **`text`** |
| When the prediction was created | **`created_date`** (start of the **open** period from a product perspective) |
| Lifecycle | **`status`** (`prediction_status` enum) and several timestamp columns (see below) |
| Season membership | **`season_id`** (nullable), **`season_applicable`**. **Seasons** are **non-overlapping** time ranges; a prediction is associated with **at most one** season (assignment rules use an anchor date — see [`scoring.md`](scoring.md)). **`season_id`** may be **null** if the prediction’s relevant dates fall beyond any season defined so far (e.g. far-future prediction). |
| Payout multipliers | **`endorse_ratio`**, **`undorse_ratio`** (used when computing bet payouts after judgement) |

Predictions are **visible to all players**; engagement beyond authorship happens through **bets** (endorse / undorse) and, after closing, **outcome votes**.

---

## Drivers: how a prediction “ends” and when it is adjudicated

Each prediction has **`driver`**: **`date`** or **`event`** (`prediction_driver` enum). This captures your **predicate + trigger** idea at a high level:

- **Date-driven (`date`)**  
  The prediction is tied to a **fixed adjudication horizon** set at creation time: **`due_date`**. When that time is reached (or a player **triggers** early), the prediction **closes**—no new bets, and the community can vote on whether the claim came true.

- **Event-driven (`event`)**  
  There is **no** automatic close from `due_date` (API shape exposes `due_date: null` for event predictions). The prediction stays **open** until someone **triggers** it (see **Closing and triggering**). To avoid predictions being forgotten, the author sets **`check_date`**: a **check-in** time when the system asks whether the triggering event has happened yet.

There is also **`last_check_date`**, maintained from **`snooze_checks`** (most recent check date for that prediction)—useful for “when did we last run a check?” without scanning all check rows.

---

## Bets: endorse and undorse

Players **bet** on whether they believe the prediction will come true:

- **Endorse** — “I think it will happen.” (`endorsed = true`)
- **Undorse** — playful name for the opposite (`endorsed = false`)

Rows live in **`bets`**: **`user_id`**, **`prediction_id`**, **`endorsed`**, **`date`** (when the bet was placed), **`wager`**, **`valid`**, and post-judgement **`payout`** / **`season_payout`**. There is **one bet per user per prediction** (`UNIQUE (user_id, prediction_id)`); flipping endorse/undorse updates that row.

**Author auto-endorse:** when a prediction is created, the server **inserts an endorsement bet** for the author (same `user_id` as the prediction, `endorsed: true`).

Bets have a **finite window** in which they can be changed; enforcement uses **`GM_PREDICTION_UPDATE_WINDOW_HOURS`** ( **`12` in production** , see `config.gameMechanics.predictionUpdateWindowHours`). **Wager** scales with how long before close the bet was placed (DB function `refresh_wager` uses day differences between bet time and the prediction’s close/due/check dates).

---

## Prediction status and lifecycle (`prediction_status`)

Allowed values: **`open`**, **`checking`**, **`retired`**, **`closed`**, **`successful`**, **`failed`**.

**`status` is derived** when certain columns change: trigger `prediction_status_update_from_prediction` runs `refresh_prediction_status()` (see `db/schema.sql`). Rough ordering:

1. **`retired`** if **`retired_date`** is set.
2. Otherwise **`successful`** or **`failed`** if **`judged_date`** is set (outcome from **votes**; see **Judgement**).
3. Otherwise **`closed`** if **`closed_date`** is set.
4. Otherwise **`checking`** if there is an **open** snooze check (`snooze_checks` with `closed = false` for this prediction).
5. Otherwise **`open`**.

So **`checking`** is not only “check_date arrived”—it means an **active `snooze_checks` row** is open.

---

## Retiring a prediction (typo / mistake escape hatch)

While a prediction is **`open`**, the **author** may **retire** it: **`retired_date`** is set → status becomes **`retired`**.

Retirement is only allowed in a **configurable time window** after **`created_date`**, and **not past the earlier of** that window and the prediction’s relevant end date (**`due_date`** for date-driven, **`check_date`** for event-driven). The window length comes from **`GM_PREDICTION_UPDATE_WINDOW_HOURS`** (**12 hours in production**).

After that window, the prediction stays **open** until close/snooze/judge flows apply.

---

## Check-in flow for event-driven predictions (`checking`, snoozes)

When an event-driven prediction’s **`check_date`** passes, a **monitor** (`Snooze Check` in `app/src/domain/predictions/config.ts`) selects the next prediction to check and **creates a row in `snooze_checks`** for it. That monitor runs during **business hours** (see **Background monitors and timing**), so the check-in row may appear shortly after **`check_date`**, not necessarily the same second. That opens the **checking** phase (open snooze check → **`checking`** status via trigger logic).

### Player votes on how long to postpone

Players record preferences in **`snooze_votes`** (composite key `snooze_check_id`, `user_id`; **`value`** is one of **1, 7, 30, 90, 365** days—day, week, month, quarter, year). The API aggregates these into per-option counts (e.g. `values.day`, `values.week`, … on each check).

**Consensus rule (as implemented):** when **any single option reaches at least 3 votes**, the check is **closed**, **`check_date`** on the prediction is advanced by that many days, and the prediction returns to **`open`** (snooze check closed, no open check → back to open). If several tallies cross 3 around the same time, code resolves via iteration order; **in practice** ties are rare and **whichever option hits 3 first** ends the check.

There is also an **`Unactioned Snooze Check`** monitor: checks that remain unclosed and stale can be **automatically deferred** (implementation uses a query for checks past **`check_date` by at least one day**—see `getNextUnactionedSnoozeCheck`).

---

## Closing and triggering

**Close** means: set **`closed_date`**, set **`triggered_date`** (to the time of the close operation), optionally set **`triggerer_id`** if a user triggered it, and invalidate/snap bets as designed (`valid` ties to `closed_date`; see `refresh_valid`).

- **Date-driven automatic close:** a **Trigger Check** monitor finds date-driven predictions whose **`due_date`** is in the past and still **`open`**, then closes them with **`triggerer_id: null`** and **`closed_date`** set from **`due_date`** (see `closeByTriggerer` / trigger flow). Like other trigger/snooze jobs, this runs on a **business-hours** schedule (see **Background monitors and timing**), so close may lag **`due_date`** slightly.

- **Manual / early trigger:** a user can trigger close earlier; **`triggerer_id`** records who did it. Behaviour matches “close like due date hit” for stopping bets.

Event-driven predictions **stay open until triggered** (no automatic close from `due_date` alone).

---

## Outcome votes and judgement

After **`closed`**, any player may cast an outcome vote in **`votes`**: **`vote`** boolean (`true` = yes / came true, `false` = no). **`(user_id, prediction_id)`** is unique; a user can **update** their vote (`ON CONFLICT … DO UPDATE` in `addVote`).

**Judgement** is performed by a **Judgement Check** monitor (**every 10 minutes, all day**; see `app/src/domain/predictions/config.ts`) that selects predictions that are **`closed`** and whose **`triggered_date`** is **more than one day** ago (`getNextPredictionToJudge`), then sets **`judged_date = NOW()`**. Combined with stateless polling, the real interval is **at least ~24 hours** after close, often a bit more—see **Background monitors and timing**.

When **`judged_date`** is set, **`refresh_prediction_status`** sets **`successful`** vs **`failed`** from the **statistical mode** of `votes.vote` (PostgreSQL **`mode() WITHIN GROUP (ORDER BY vote)`**). If the modal value is **true** → **`successful`**; **anything else** (**false** modal, **ties**, **no votes**, or a NULL mode edge case) → **`failed`**. The design goal is that **every closed prediction is eventually judged**; **a tie is not enough** for success (you need a **yes** majority in the modal sense—“tie +1” would count as successful; a bare tie does not). That matches the current SQL.

**`successful`** / **`failed`** is when **points and bet payouts** are applied (DB payout functions treat **`closed`** and **`open`** as not yet paid).

---

## What this doc did not fully specify

- **Points math** and **derived columns** — [`scoring.md`](scoring.md) and [`denormalized-data.md`](denormalized-data.md).
- Season **close automation** (`Season End Check` in `app/src/domain/seasons/config.ts`).
- Discord / web UX for each step.

---

## Glossary

| Concept | Notes |
|--------|--------|
| **Undorse** | Product term for betting **against** the prediction coming true (`endorsed = false`). |
| **Trigger** | Close the prediction for adjudication; sets **`closed_date`**, **`triggered_date`**, and optional **`triggerer_id`**. |
| **Snooze check** | A **`snooze_checks`** row representing an active check-in period for an event-driven prediction. |
| **Snooze vote** | A **`snooze_votes`** row: how many days the player wants to push **`check_date`**. |

---

## Schema quick reference (predictions-adjacent)

| Table | Role |
|-------|------|
| `predictions` | Core prediction row; `user_id` = predictor. |
| `bets` | Endorse / undorse stakes per user per prediction. |
| `votes` | Yes/no outcome votes after close. |
| `snooze_checks` | Check-in episodes for event-driven predictions. |
| `snooze_votes` | Per-user preferred delay (1/7/30/90/365 days) for a check. |
| `seasons` | Non-overlapping time-bounded scoring windows (`start` / `end`); detail TBD in scoring doc. |

Generated column **`search_vector`** on `predictions` backs **full-text search** (implementation detail for listings/search).
