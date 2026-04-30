---
name: ndb2-scoring-seasons
description: >-
  NDB2 wagers, endorse/undorse ratios, payout vs season_payout, seasons,
  wager_cap, bets.valid vs predictions.season_applicable. Use when changing
  scoring, payouts, seasons, or SQL/TS that reads bet or season points; read
  docs/scoring.md first.
---

# NDB2 scoring and seasons

## Read first

- **`docs/scoring.md`** — wager math, ratios, payouts, seasons, **`valid`** vs **`season_applicable`**.
- **`docs/denormalized-data.md`** — which triggers maintain **`wager`**, ratios, **`payout`**, **`season_applicable`**.
- **Payout SQL**: `db/schema.sql` — `refresh_wager`, `refresh_valid`, `refresh_prediction_ratios_*`, `refresh_payouts_from_prediction`, `refresh_payouts_from_season`, `calc_payout_ratio`.
- **Example formulas**: `db/src/seeds/dev/seasons.json` (`payout_formula`).

## Wager (`bets.wager`)

- Day difference between **`bets.date`** and anchor **`COALESCE(closed_date, due_date, check_date)`** (see SQL in **`refresh_wager`**). After **close**, **`closed_date`** wins; before close, **date** driver uses **`due_date`**, **event** driver uses **`check_date`**.
- Each bet has its **own** wager depending on when it was placed; snooze / early trigger / backdate can **change** wagers via prediction date updates.

## Odds (`endorse_ratio`, `undorse_ratio`)

- Computed from **valid** bets’ total/ side wager masses and the season’s **`payout_formula`** (dynamic SQL via **`calc_payout_ratio`**). Lopsided endorse → lower endorse multiplier, higher undorse multiplier.

## Payouts

- **`bets.payout`**: all-time; **`FLOOR(wager * ratio)`** with sign from outcome (see trigger).
- **`bets.season_payout`**: uses **`LEAST(wager, seasons.wager_cap)`**; **NULL** when **`season_applicable`** is false, **`valid`** is false, or status not yet judged.
- **Judged** statuses: **`successful`** / **`failed`**; **`open`**, **`retired`**, **`closed`** keep payouts **NULL** where the trigger dictates.

## Seasons

- **`season_id`**: assignment uses anchor in **`(`start`, `end`]`** — **`COALESCE(closed_date, due_date, check_date)`**. **Provisional** while open (due/check); **finalized** after **close** when **`closed_date`** drives the anchor.
- **`seasons.wager_cap`**: denormalized season length in days; caps effective wager for **`season_payout`**.

## `bets.valid` vs `predictions.season_applicable`

- **`valid`**: **`bets.date < predictions.closed_date`** (after triggers). **Invalid** → no **`payout`** / **`season_payout`**, excluded from ratio sums. Stops abuse when **`closed_date`** is **backdated** and someone bets after the adjudication instant.
- **`season_applicable`**: set when **`season_id`** changes to **`NOT seasons.closed`** for that season. **`false`** when (re)bucketed into an **already closed** season — typical case **backdated** **`closed_date`** into a wrapped quarter — so **`season_payout`** does not move that closed leaderboard. **Not** the same as **`valid`**; **not** “flip all rows when `closeSeasonById` runs.”

## Anti-patterns

- Hand-updating **`payout`**, **`season_payout`**, **`endorse_ratio`**, or **`wager`** in app code as source of truth (triggers own these).
- Mixing up **`valid`** (bet vs **`closed_date`**) with **`season_applicable`** (season row **`closed`** at **`season_id`** assignment).
- Documenting **`failure`** instead of enum **`failed`**.
