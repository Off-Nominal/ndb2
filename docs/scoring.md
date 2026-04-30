# NDB2 scoring and seasons

This document explains **how points are earned and lost** through **wagers**, **odds multipliers**, **payouts**, and **seasons**. For prediction lifecycle (open → close → judge), see [`game-mechanics.md`](game-mechanics.md).

---

## Wager (`bets.wager`)

The **wager** is an integer on each **`bets`** row. It is meant to capture **how far ahead** the bettor committed relative to when the prediction is (or was) **scheduled to resolve**:

- Conceptually, it is the **difference in days** between the **resolution anchor** of the prediction and the **bet’s timestamp** (`bets.date`).
- Bettors can join **any open** prediction at different times, so **each bet has its own wager** depending on when it was placed.

**Resolution anchor (dynamic):**

| Prediction state | Anchor used in DB |
|------------------|-------------------|
| Not yet **closed** | `COALESCE(due_date, check_date)` — **date-driven** predictions use **`due_date`**; **event-driven** use **`check_date`** (see drivers in `game-mechanics.md`). |
| **Closed** | **`closed_date`** becomes the fixed anchor (early trigger, snooze, etc. can move this relative to the original due/check). |

So a wager **can change** after the fact: triggers that set or move **`closed_date`**, or updates to **`due_date`** / **`check_date`** (e.g. snooze), cause **`bets.wager`** to be recomputed for every bet on that prediction.

**Implementation (denormalized):** `refresh_wager()` in `db/schema.sql` computes:

```text
EXTRACT(day FROM COALESCE(closed_date, due_date, check_date) - bets.date)
```

with guards so a **zero** interval does not wipe the wager (defaults toward **1** day minimum in the SQL). Wagers refresh on **INSERT** into `bets` and on **UPDATE** of `due_date`, `closed_date`, or `check_date` on `predictions`.

More denormalized fields and **exact trigger wiring** are in [`denormalized-data.md`](denormalized-data.md).

---

## Odds: `endorse_ratio` and `undorse_ratio`

**`predictions.endorse_ratio`** and **`predictions.undorse_ratio`** are **per-prediction multipliers** used when turning a wager into points. They implement **odds** so heavily **one-sided** markets pay less for the crowded side and more for the contrarian side.

- **Inputs** are derived from **valid** bets: total wager mass on the prediction, and how much sits on **endorse** vs **undorse** (see `refresh_prediction_ratios_from_*` in `db/schema.sql`).
- The shape of the curve comes from the **season’s** **`payout_formula`**: a string of SQL that **`calc_payout_ratio`** executes with bound parameters (`$1` = total wager integer, `$2` = a **share** on the side being priced — endorse stack for `endorse_ratio`, undorse stack for `undorse_ratio`). Different seasons can therefore use **different formulas**.
- Typical seeded formulas look like a **logarithmic** adjustment, e.g. `(ln($1/$2/2.0)/1.3)+1` in `db/src/seeds/dev/seasons.json` — **production** values live in your `seasons` rows.
- When **bets are balanced**, multipliers stay near **1**; when endorsements dominate, **`endorse_ratio`** **drops** (easier “gimme” side earns less) and **`undorse_ratio`** **rises** (contrarians earn more if they are right).

**Denormalized:** ratios update when **`bets`** change (**`wager`**, **`valid`**, **`endorsed`**), when a prediction’s **`season_id`** changes, or when a **`seasons.payout_formula`** changes—see [`denormalized-data.md`](denormalized-data.md) for trigger names.

---

## Judgement payouts (`bets.payout`, `bets.season_payout`)

After a prediction is judged **`successful`** or **`failed`**, each bet gets **integer** payouts (including **losses** as negative values) from **`refresh_payouts_from_prediction`** (and refreshed when **`seasons`** change).

**Win vs loss:**

- **Correct** side: `successful` + endorse, or `failed` + undorse → positive payout factor.
- **Wrong** side → **negative** factor (lose the same **magnitude**).

**All-time / uncapped (`bets.payout`):**

- Uses **`FLOOR(wager * ratio)`** with a **non-zero floor** (see `NULLIF` / `COALESCE` in `refresh_payouts_from_prediction` — tiny products still become at least **±1** when applicable).
- Example (illustrative): wager **80**, **`endorse_ratio`** **0.7** → about **56** points on a **winning** endorsement; **−56** on a loss.

**Season-scoped (`bets.season_payout`):**

- Same sign logic, but the wager term is **`LEAST(b wager, seasons.wager_cap)`** so **season** points cannot explode from **very long** predictions that finally resolve.
- **`season_payout`** is **NULL** when **`predictions.season_applicable`** is **false** or **`bets.valid`** is **false** (see below), or while status is not yet judged.

Until judgement (`open`, `retired`, `closed`), payouts stay **NULL**.

---

## Seasons (`seasons`)

**Seasons** partition the timeline into **non-overlapping** **`start` / `end`** windows (often **calendar quarters**; that is **data-driven** and may change).

**Purpose:** give **competitive resets** so new players can compete on **season** leaderboards; **all-time** totals can still sum **`payout`** (and related queries).

### Which season is a prediction in? (`predictions.season_id`)

Assignment is **denormalized** in **`refresh_prediction_seasons()`**: pick the season where this **anchor** falls in **`(start, end]`**:

```text
anchor = COALESCE(closed_date, due_date, check_date)
anchor > season.start AND anchor <= season.end
```

So:

- **While the prediction is still open**, **`season_id`** is **provisional**: the anchor is **`due_date`** or **`check_date`**, so the UI and queries can place the prediction in a likely season before anyone closes it.
- **After close**, **`closed_date`** becomes the anchor and **`season_id`** is **finalized** for that rule (unless dates are edited again).

**`season_id`** may be **NULL** if no season’s window contains that anchor (e.g. prediction **too far in the future** relative to defined seasons), as in `game-mechanics.md`.

### Wager cap (`seasons.wager_cap`)

**`wager_cap`** is **denormalized** from the season length: **`EXTRACT(day FROM end - start)`** via **`refresh_wager_cap`** on season insert/update. It is the **maximum effective wager** for **`season_payout`** (see above). **All-time** **`payout`** still uses the **full** **`bets.wager`**.

### Season lifecycle (`seasons.closed`, `predictions.season_applicable`)

- **`seasons.closed`**: operational flag. A season stays **open** until outstanding scoring is finished; then automation can **close** it (see **`Season End Check`** in `app/src/domain/seasons/config.ts`: close only when the **last** season has **no** predictions still in **`open`**, **`checking`**, or **`closed`**).
- **`predictions.season_applicable`**: **`false`** when **`season_id`** points at **an already closed** season (typically **backdated** **`closed_date`**); gates **`season_payout`**. See the next section and [`denormalized-data.md`](denormalized-data.md).

---

## Bet validity (`bets.valid`) and season applicability (`predictions.season_applicable`)

These solve **different** problems:

### `bets.valid` — bet timestamp vs **`closed_date`** (abuse / backdated close)

**`bets.valid`** marks whether a bet was placed **before** the prediction’s **`closed_date`** (see `refresh_valid` in **`db/schema.sql`** and [`denormalized-data.md`](denormalized-data.md)).

- **Purpose:** If staff **backdate** **`closed_date`** because a trigger was missed, players who **bet after the true outcome was knowable** (post-**`closed_date`**) are flagged **invalid**.
- **Effect:** Invalid bets are **excluded from ratio sums** and get **`payout`** / **`season_payout`** = **NULL** — **no** points in either **all-time** or **season** scoring paths.

### `predictions.season_applicable` — backdate into a **closed** season

**`season_applicable`** is **`false`** when the prediction is (re)assigned a **`season_id`** for a season that **already** has **`seasons.closed = true`**—the usual scenario is **backdating** **`closed_date`** so the anchor falls in a **past, wrapped-up** quarter. Then **`season_payout`** is suppressed for that row (see payout trigger), so closed-season leaderboards are not moved by that late fix-up. This is **separate** from **`bets.valid`** (late bets after **`closed_date`**).

For **normal** closes while the season is still open, **`season_applicable`** is **`true`** when **`season_id`** is written. **`refresh_prediction_season_applicable()`** runs on **`season_id`** changes and sets **`NOT seasons.closed`** for that season; **`closeSeasonById`** only flips **`seasons.closed`** and does **not** need to bulk-update every prediction for your rule set—see [`denormalized-data.md`](denormalized-data.md).

## Quick reference

| Column / table | Role |
|----------------|------|
| `bets.wager` | Day distance from bet time to resolution anchor; recomputed when prediction dates move. |
| `bets.valid` | **`bet.date < closed_date`**; invalid → no **`payout`** / **`season_payout`**, and excluded from odds inputs. |
| `predictions.endorse_ratio` / `undorse_ratio` | Odds multipliers from wager distribution + season **`payout_formula`**. |
| `bets.payout` | Post-judgement all-time points (`wager * ratio`, sign by outcome). |
| `bets.season_payout` | Post-judgement season points (`LEAST(wager, wager_cap) * ratio`), NULL if not season-applicable or invalid. |
| `seasons.payout_formula` | Executable SQL snippet for **`calc_payout_ratio`**. |
| `seasons.wager_cap` | Max wager days for **`season_payout`** (season length in days). |
| `seasons.closed` | Season wrapped; used when **`season_id`** is set to decide **`season_applicable`** (`NOT closed`). |

---

## Related docs

- **[`denormalized-data.md`](denormalized-data.md)** — triggers and maintenance for all derived columns.
- **[`game-mechanics.md`](game-mechanics.md)** — prediction lifecycle and monitors.
