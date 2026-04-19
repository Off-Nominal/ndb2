---
name: app-config
description: >-
  Single Zod-validated runtime configuration from process.env at
  app/src/config.ts, imported via @config. Use when adding or changing env
  vars, boot validation, or wiring new features to configuration.
---

# Application configuration (`@config`)

## Single source

- **Module:** `app/src/config.ts` — builds `export const config` once at import time with **Zod 4**. On validation failure it logs **`formatConfigError`** (each issue mapped to the real **`process.env` name**, e.g. `DATABASE_URL`) in **red on stderr** when supported, then **`process.exit(1)`** — it does **not** rethrow `ZodError`, so Node will not print a second JSON dump/stack for that case. Set **`NO_COLOR`** to disable ANSI; set **`FORCE_COLOR=1`** to force color when stderr is not a TTY.
- **Import path:** `import { config } from "@config"` — path alias in `app/tsconfig.json` (`"@config": ["src/config.ts"]`), mirrored in `app/vitest.shared.ts`. Do not use relative imports to the config file from feature code.
- **Do not** read `process.env` elsewhere in `app/src` for application behavior (tests may set `process.env` before modules load; see below).

## Adding or changing a variable

1. Add the key to `buildRawFromProcessEnv()` in `config.ts`.
2. Extend the Zod `rawConfigSchema` / `appConfigSchema.transform` output with a clear, grouped shape (`discord`, `api`, `database`, etc.).
3. Run the app or tests; fix failures from stricter validation.
4. Update `app/.env.example` so required keys are documented.

Follow Zod major-version APIs per `.cursor/skills/input-validation/SKILL.md`.

## Required vs optional

- **Required at boot** include `DATABASE_URL`, Discord OAuth and web-portal fields (`DISCORD_OAUTH_*`, `DISCORD_BOT_TOKEN`, `OFFNOMDISCORD_GUILD_ID`, at least one `ROLE_ID_*`), `DISCORD_CLIENT_API_KEY`, `GM_PREDICTION_UPDATE_WINDOW_HOURS`, etc. — see `rawConfigSchema` for the canonical list.
- **Optional / defaulted:** e.g. `WEBHOOK_DISCORD_BOT` (empty → no webhook subscribers), `WEB_DISCORD_AUTHZ_RECHECK_HOURS` (invalid values fall back to 24 hours), `PORT` / `PG_POOL_MAX` defaults.

## Tests and load order

- `app/src/test/install-test-env.ts` runs first (Vitest `setupFiles` and as the first import in `app/src/test/global-setup.ts`) so `process.env` is complete **before** any import pulls in `@config` (via `@shared/utils` or other modules).
- The Postgres pool in `app/src/data/db/index.ts` uses `process.env.DATABASE_URL ?? config.database.url` so integration tests can point at an ephemeral DB after `resetPoolForTests()`.

## Related utilities

- `resolveTrustProxy` / `TrustProxyResolved` — trust proxy behavior; `configureTrustProxy(app)` uses `config.server.trustProxy`, or pass `configureTrustProxy(app, resolveTrustProxy(...))` in tests.
- `collectWebPortalRoleIdsFromEnv` — collects `ROLE_ID_*` from a given env object (used when building config).
