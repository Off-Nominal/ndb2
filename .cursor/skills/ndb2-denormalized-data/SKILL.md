---
name: ndb2-denormalized-data
description: >-
  PostgreSQL triggers and functions that maintain derived columns on
  predictions, bets, and seasons. Use when writing migrations, editing
  db/schema-affecting SQL, or changing INSERT/UPDATE paths that touch wager,
  status, ratios, payouts, season_id, season_applicable, valid; read
  docs/denormalized-data.md and verify db/schema.sql.
---

# NDB2 denormalized columns and triggers

## Read first

- **`docs/denormalized-data.md`** — level-1/2/3 column inventory, trigger names, corrections vs old README myths.
- **`db/schema.sql`** — source of truth for **`CREATE FUNCTION`** / **`CREATE TRIGGER`** (regenerate or diff after migrations).
- **`app/README.md`** — short pointer to **`docs/denormalized-data.md`**.

## Dependency layers

1. **Level 1 —** **`predictions.status`**, **`season_id`**, **`season_applicable`**, **`last_check_date`**, **`bets.wager`**, **`bets.valid`**, **`seasons.wager_cap`**
2. **Level 2 —** **`predictions.endorse_ratio`**, **`undorse_ratio`**
3. **Level 3 —** **`bets.payout`**, **`season_payout`**

Changing Level 1 columns can cascade (same statement / follow-on triggers) to deeper levels. Order **migrations** and data backfills with this graph in mind.

## High-signal facts (do not misremember)

- **`prediction_status`** is **not** updated by a trigger on **`snooze_checks.closed`**. It runs from **`predictions`** **`INSERT OR UPDATE OF`** `retired_date`, `closed_date`, `judged_date`, `check_date`, **`last_check_date`**. **`INSERT` `snooze_checks`** updates **`last_check_date`**, which can move status to **`checking`** indirectly.
- **`last_check_date`** comes from **`INSERT`** on **`snooze_checks`**, not a table named `checks`.
- **`prediction_payout_ratio_from_bet`** fires on **`bets` `UPDATE OF`** **`valid`**, **`endorsed`**, **`wager`** — new bets get ratio updates when **`INSERT` → `refresh_wager` → `UPDATE` wager** fires this trigger.
- **`season_applicable`** refreshes on **`predictions` `UPDATE OF`** **`season_id`** only; see **`ndb2-scoring-seasons`** for product meaning.

## When adding a new derived column

1. Add a **`SECURITY DEFINER`** function (match existing style in **`db/schema.sql`**).
2. Attach **`AFTER`** triggers on the **minimal** set of tables/columns.
3. Document the new column in **`docs/denormalized-data.md`** and consider **`docs/scoring.md`** / **`game-mechanics.md`** if product-visible.
4. Regenerate PgTyped / app query layers if **`app/src/data/queries`** selects change.

## Anti-patterns

- **`UPDATE predictions SET status = ...`** from application code instead of updating driving dates / snooze state.
- New **`UPDATE`** paths on **`predictions`**, **`bets`**, or **`seasons`** that skip trigger expectations (e.g. bulk raw SQL without understanding cascade).
- Renaming triggers/functions in migrations without updating **`docs/denormalized-data.md`**.
