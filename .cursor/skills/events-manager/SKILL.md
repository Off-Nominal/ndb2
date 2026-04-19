---
name: events-manager
description: Describes the NDB2 Events Manager (eventsManager) as the root typed game-event bus for user/game-engine actions. Use when adding a new game event, emitting events from routes/monitors, or wiring downstream consumers like v2 webhooks.
---

# Events Manager (Game Events)

## What it is

- `app/src/domain/events/events-manager.ts` exports `eventsManager`, a **singleton typed event emitter** for **game events**.
- A “game event” is something meaningful to players/observers (user actions or game-engine actions), not low-level internal signals.
- Other systems “fan out” from it (e.g. `app/src/domain/webhooks/config.ts` sends v2 webhooks for selected events).

## When to use it

Use `eventsManager` when:

- A **prediction state changes** in a user-relevant way (triggered, judged, snoozed, etc.)
- A **user action** happens (new prediction, vote, bet, snooze vote, edits)
- A **monitor/game-engine action** happens that players should know about

Avoid `eventsManager` for:

- purely technical events (cache hits, cron heartbeat, retries, background job bookkeeping)
- internal invariants / orchestration signals that aren’t meaningful outside the service

## How to add a new event (repo pattern)

1. **Add the typed event name**
   - Update `NDBEvents` in `app/src/domain/events/events-manager.ts`.
   - Payload types should usually be v2 DTOs (commonly `API.Entities.Predictions.Prediction`).

2. **Emit it at the source of truth**
   - Emit from the place where the state transition happens and you have the final DTO.
   - Common sources:
     - v2 routes under `app/src/api/v2/routes/**` (after DB write, re-fetch updated DTO, then `emit`)
     - monitors under `app/src/domain/monitors/config.ts`

3. **Wire downstream consumers**
   - **v2 webhooks**: add a listener in `app/src/domain/webhooks/config.ts` that calls:
     - `generateResponse("<event_name>", { ... })`
     - `notifySubscribers(subscribers, payload)`
   - Keep webhook payloads aligned with the shared type package: `@offnominal/ndb2-api-types/v2`.

4. **Update shared webhook types when adding a new webhook event**
   - If the event should be externally visible via v2 webhooks, update:
     - `types/src/v2/webhooks.ts`
       - add to `WEBHOOK_EVENTS`
       - add `Events.<Name>` payload type
       - add it to the `Payload` union

## Naming and payload conventions

- **Event names** are snake_case strings (e.g. `triggered_prediction`, `judged_prediction`).
- Prefer emitting a **single primary object** (often `{ prediction }` for webhooks) rather than multiple loosely-related fields.
- Emit **after** mutations complete, using the **updated** v2 DTO (typically via `app/src/data/queries/**` wrappers).

## Quick reference (key files)

- **Event bus**: `app/src/domain/events/events-manager.ts`
- **Webhook fanout**: `app/src/domain/webhooks/config.ts`
- **Webhook event types**: `types/src/v2/webhooks.ts`
- **Common emitters**:
  - v2 routes: `app/src/api/v2/routes/**`
  - monitors: `app/src/domain/monitors/config.ts`
