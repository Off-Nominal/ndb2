---
name: ndb2-game-mechanics
description: >-
  NDB2 prediction lifecycle, drivers (date vs event), statuses, snooze checks,
  monitors, and public betting rules. Use when changing domain behavior around
  predictions, triggers/closes, snooze/votes, monitors under app/src/domain, or
  API/schema fields tied to lifecycle; read docs/game-mechanics.md first.
---

# NDB2 game mechanics

## Read first

- **`docs/game-mechanics.md`** — canonical product + schema mapping.
- **Monitors**: `app/src/domain/predictions/config.ts` (trigger/snooze/judgement schedules; business-hours UTC vs 24/7 judgement).
- **Schema enums**: `db/schema.sql` — `prediction_status`, `prediction_driver`; tables `predictions`, `bets`, `votes`, `snooze_checks`, `snooze_votes`.

## Schema / API naming

- Predictor on **`predictions`** is column **`user_id`**; v2 queries often alias **`predictor_id`**; API exposes **`predictor`**.

## Status

- **`predictions.status`** is **derived** by trigger **`refresh_prediction_status()`** (see **`denormalized-data`** skill / `docs/denormalized-data.md`). Do not treat status as a free-form string: enum values are **`open`**, **`checking`**, **`retired`**, **`closed`**, **`successful`**, **`failed`** (not `failure`).
- **Checking** means an **open** **`snooze_checks`** row (`closed = false`) exists for the prediction, not only “check_date passed.”

## Drivers

- **`date`**: **`due_date`**; automatic close when due passes (subject to monitor schedules).
- **`event`**: **`check_date`**; no automatic close from due; stays open until triggered; check-in creates **`snooze_checks`**.

## Bets

- One row per user per prediction; **endorse** / **undorse**. Author gets an automatic endorsement on create.
- Bets only while **`open`** (product); bet edit window uses **`GM_PREDICTION_UPDATE_WINDOW_HOURS`** (12h production).

## Snooze consensus

- Snooze votes live in **`snooze_votes`** (values **1, 7, 30, 90, 365** days). **≥3** votes on one option closes the check and pushes **`check_date`**.

## Monitors / timing

- **Stateless** polling: downtime does not permanently skip work; **“~24h”** before judgement is **at least** a day after **`triggered_date`**, often longer.
- **Trigger / snooze** monitors run in **12:00–21:59 UTC** windows; **judgement** runs **every 10 minutes** all day — see `game-mechanics.md`.

## Anti-patterns

- Assuming instant close exactly at **`due_date`** wall-clock.
- Updating **`status`** in application code instead of setting the timestamps / rows the triggers use.
- Conflating **`checking`** with calendar **`check_date`** without an open **`snooze_checks`** row.
