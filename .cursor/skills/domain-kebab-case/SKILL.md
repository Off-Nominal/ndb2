---
name: domain-kebab-case
description: >-
  Requires kebab-case filenames for modules under app/src/domain. Use when
  adding, renaming, or importing files in app/src/domain, or when a PR touches
  domain layout or @domain/* path aliases.
---

# Domain module filenames (kebab-case)

All **files** under `app/src/domain/` use **kebab-case** names, including test suffixes:

- `season-manager.ts`, `season-manager.test.ts`, `season-manager.integration.test.ts`
- `discord-gateway.ts`, `discord-web-portal-env.ts`
- `events-manager.ts`, `game-mechanics.ts`, `monitor-runner.ts`, `with-pool-client.ts`

**Imports** use the same stem as the file (via `@domain/...` or relative paths):

- `@domain/events/events-manager`
- `@domain/seasons/season-manager`

**Symbols inside files** stay idiomatic TypeScript (`eventsManager`, `SeasonManager`, `MonitorRunner` classes, etc.); only **filenames** are kebab-case.

Subfolders stay lowercase single words where they already are (`discord/`, `events/`, `monitors/`, `predictions/`, `seasons/`, `webhooks/`).
