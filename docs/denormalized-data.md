# Denormalized columns and triggers

NDB2’s core tables (**`seasons`**, **`predictions`**, **`bets`**, **`users`**, **`votes`**) are often aggregated together for APIs and scoring. To avoid heavy repeated joins and subqueries, several **derived** values are **materialized on rows** and kept consistent with **PostgreSQL triggers and functions**.

This document is the **canonical inventory** of those columns. It was reconciled against **`db/schema.sql`** (current dump). Historical behavior may appear in **`db/migrations/`** and **`db/migrations_archive/`**; when in doubt, **`db/schema.sql`** wins.

Related docs: **[`scoring.md`](scoring.md)** (what the numbers *mean*), **[`game-mechanics.md`](game-mechanics.md)** (lifecycle).

---

## Corrections vs the old `app/README.md` list

| Old README claim | Actual schema (`db/schema.sql`) |
|------------------|----------------------------------|
| `refresh_prediction_status()` also on **UPDATE (`closed`)** on **`checks`** | **No** trigger on **`snooze_checks`** for status. Status refreshes from **`predictions`** on **`INSERT OR UPDATE OF`** `retired_date`, `closed_date`, `judged_date`, `check_date`, **`last_check_date`**. **Indirect path:** **`INSERT`** into **`snooze_checks`** runs **`refresh_last_checked_date`**, which may update **`predictions.last_check_date`**, and **that** **`predictions`** update runs **`prediction_status_update_from_prediction`**. |
| **`last_check_date`** from **`INSERT` into `checks`** | Table is **`snooze_checks`**. Trigger: **`prediction_last_check_date_from_snooze_checks`** **`AFTER INSERT`** on **`snooze_checks`**. |
| Typo **`predicitions`**, **`LEvel`** | Fixed throughout this doc. |
| Trigger name **`refresh_prediction_ratios_from_bet`** | Function name; trigger is **`prediction_payout_ratio_from_bet`**. |

---

## Level 1 — derived directly from normalized / core columns

These are updated when **source tables** change as described. Some Level 1 updates **cascade** to Level 2 / 3 via further triggers on the same statement(s).

### `predictions.status` (`prediction_status` enum)

| | |
|--|--|
| **Maintained by** | `refresh_prediction_status()` |
| **Trigger** | `prediction_status_update_from_prediction` |
| **On** | **`predictions`**: `AFTER INSERT OR UPDATE OF` `retired_date`, `closed_date`, `judged_date`, `check_date`, **`last_check_date`** |

**Note:** Open **`snooze_checks`** rows (`closed = false`) contribute to **`checking`** inside the function. **`last_check_date`** is maintained separately (below); it is **not** the same as “a snooze row’s `closed` flag changed.”

---

### `predictions.season_id` (nullable FK → `seasons`)

| | |
|--|--|
| **Maintained by** | `refresh_prediction_seasons('prediction' \| 'all')` |
| **Triggers** | `prediction_season_update_from_prediction` — **`predictions`**: `AFTER INSERT OR UPDATE OF` `closed_date`, `due_date`, `check_date`; **`prediction_season_update_from_season`** — **`seasons`**: `AFTER INSERT OR DELETE OR UPDATE OF` `start`, `"end"` (updates **all** predictions when `'all'`) |

Anchor used: **`COALESCE(closed_date, due_date, check_date)`** must fall in **`(`**`season.start`**,** **`season.end`**`]** per function body.

---

### `predictions.season_applicable` (boolean)

| | |
|--|--|
| **Maintained by** | `refresh_prediction_season_applicable()` — sets `COALESCE((SELECT NOT closed FROM seasons s WHERE s.id = NEW.season_id), true)` |
| **Trigger** | `prediction_season_applicable_update_from_predictions` |
| **On** | **`predictions`**: `AFTER UPDATE OF` **`season_id`** **only** |

**Product meaning:** **`season_applicable`** is **`false`** when the prediction’s **`season_id`** points at a season that is **already** **`seasons.closed`**. In practice the important case is a **backdated** **`closed_date`**: the anchor is recomputed, **`season_id`** is re-assigned into a **past** season that has already been wrapped up, and **`NOT closed`** is false — so **`season_payout`** stays off the closed-season board for that resolution. Predictions that **close on time** while the season is still open get **`season_applicable = true`** when **`season_id`** is set; merely **closing the season later** does **not** bulk-rewrite this flag on every row (and is **not** required for your rules—the edge case you care about is the **backdate-into-closed-season** path).

**Mechanics:** The value is refreshed **whenever `season_id` changes** (including the cascade from **`refresh_prediction_seasons`** after **`closed_date` / due / check** updates). **`UPDATE seasons SET closed = TRUE`** by itself does not re-run this function for predictions that **already** had that **`season_id`**; that matches “only false when (re)bucketed into an **already** closed season,” not “flip everyone when the season banner closes.”

### `predictions.last_check_date` (nullable timestamptz)

| | |
|--|--|
| **Maintained by** | `refresh_last_checked_date()` — `MAX(snooze_checks.check_date)` for the prediction |
| **Trigger** | `prediction_last_check_date_from_snooze_checks` |
| **On** | **`snooze_checks`**: `AFTER INSERT` |

Because **`prediction_status`** listens for **`last_check_date`** changes on **`predictions`**, new snooze rows can move a prediction into **`checking`** when appropriate.

---

### `bets.wager` (integer)

| | |
|--|--|
| **Maintained by** | `refresh_wager('bet' \| 'prediction')` |
| **Triggers** | `bet_wager_update_from_bet` — **`bets`**: `AFTER INSERT`; **`bet_wager_update_from_prediction`** — **`predictions`**: `AFTER UPDATE OF` `due_date`, `closed_date`, `check_date` |

Uses **`COALESCE(closed_date, due_date, check_date) - bets.date`** (day extraction; minimum logic in SQL). See **[`scoring.md`](scoring.md)**.

---

### `bets.valid` (boolean)

| | |
|--|--|
| **Maintained by** | `refresh_valid('bet' \| 'prediction')` — `valid = COALESCE(bets.date < predictions.closed_date, TRUE)` |
| **Triggers** | `bet_valid_update_from_bet` — **`bets`**: `AFTER UPDATE OF` **`date`**; **`bet_valid_update_from_prediction`** — **`predictions`**: `AFTER UPDATE OF` **`closed_date`** |

Invalid bets are excluded from ratio sums and payout branches. See **[`scoring.md`](scoring.md)** (backdated **`closed_date`** / abuse prevention).

---

### `seasons.wager_cap` (integer)

| | |
|--|--|
| **Maintained by** | `refresh_wager_cap()` — `EXTRACT(day FROM "end" - start)` |
| **Trigger** | `season_wager_cap_update_from_season` |
| **On** | **`seasons`**: `AFTER INSERT OR UPDATE OF` `start`, `"end"` |

---

## Level 2 — odds multipliers on predictions

### `predictions.endorse_ratio`, `predictions.undorse_ratio` (numeric)

| | |
|--|--|
| **Maintained by** | `refresh_prediction_ratios_from_bet()`, `refresh_prediction_ratios_from_prediction()`, `refresh_prediction_ratios_from_season()` |
| **Triggers** | `prediction_payout_ratio_from_bet` — **`bets`**: `AFTER UPDATE OF` **`valid`**, **`endorsed`**, **`wager`**; `prediction_payout_ratio_from_prediction` — **`predictions`**: `AFTER UPDATE OF` **`season_id`**; `prediction_payout_ratio_from_seasons` — **`seasons`**: `AFTER UPDATE OF` **`payout_formula`** |

**Chain:** `INSERT` into **`bets`** fires **`bet_wager_update_from_bet`**, which **`UPDATE`s** the new row’s **`wager`**; that **`UPDATE`** satisfies **`prediction_payout_ratio_from_bet`** (**`wager`** column), so ratios refresh without a separate “insert bet” ratio trigger.

Ratios use **`calc_payout_ratio`** with the season’s **`payout_formula`** (executable snippet). See **[`scoring.md`](scoring.md)**.

---

## Level 3 — payouts on bets

### `bets.payout`, `bets.season_payout` (nullable integer)

| | |
|--|--|
| **Maintained by** | `refresh_payouts_from_prediction()`, `refresh_payouts_from_season()` |
| **Triggers** | `bet_payout_update_from_prediction` — **`predictions`**: `AFTER UPDATE OF` **`status`**, **`endorse_ratio`**, **`undorse_ratio`**; `bet_payout_update_from_season` — **`seasons`**: `AFTER UPDATE OF` **`payout_formula`**, **`wager_cap`** |

**Depends on** prediction **`status`** (judged vs not), ratios, wager, **`valid`**, **`season_applicable`**, and joined season **`wager_cap`**. See **`refresh_payouts_from_prediction`** / **`refresh_payouts_from_season`** in **`db/schema.sql`**.

---

## Helper (not a stored denormalized column)

### `calc_payout_ratio(w integer, s numeric, f text)`

**`IMMUTABLE`** wrapper that **`EXECUTE`s** the formula string **`f`** with parameters **`$1`** = `w`, **`$2`** = `s`. Used only when computing **`endorse_ratio`** / **`undorse_ratio`**.

---

## Quick trigger index (by table)

| Table | Trigger | Function |
|-------|---------|----------|
| `bets` | `bet_valid_update_from_bet` | `refresh_valid('bet')` |
| `bets` | `bet_wager_update_from_bet` | `refresh_wager('bet')` |
| `bets` | `prediction_payout_ratio_from_bet` | `refresh_prediction_ratios_from_bet()` |
| `predictions` | `bet_payout_update_from_prediction` | `refresh_payouts_from_prediction()` |
| `predictions` | `bet_valid_update_from_prediction` | `refresh_valid('prediction')` |
| `predictions` | `bet_wager_update_from_prediction` | `refresh_wager('prediction')` |
| `predictions` | `prediction_payout_ratio_from_prediction` | `refresh_prediction_ratios_from_prediction()` |
| `predictions` | `prediction_season_applicable_update_from_predictions` | `refresh_prediction_season_applicable()` |
| `predictions` | `prediction_season_update_from_prediction` | `refresh_prediction_seasons('prediction')` |
| `predictions` | `prediction_status_update_from_prediction` | `refresh_prediction_status()` |
| `seasons` | `bet_payout_update_from_season` | `refresh_payouts_from_season()` |
| `seasons` | `prediction_payout_ratio_from_seasons` | `refresh_prediction_ratios_from_season()` |
| `seasons` | `prediction_season_update_from_season` | `refresh_prediction_seasons('all')` |
| `seasons` | `season_wager_cap_update_from_season` | `refresh_wager_cap()` |
| `snooze_checks` | `prediction_last_check_date_from_snooze_checks` | `refresh_last_checked_date()` |

---

## Maintenance

- **Source of truth:** regenerate or inspect **`db/schema.sql`** after migrations.
- **New derived columns:** add a function, attach triggers on the **minimal** column set, document the level (1→2→3) and any **indirect** chains (e.g. wager **`UPDATE`** → ratios).
