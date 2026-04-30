---
name: v2-database-queries
description: >-
  Describes how the API writes PostgreSQL access in v2 using PgTyped SQL files,
  generated query modules, and curried wrappers in index.ts. Use when adding or
  changing queries under app/src/data/queries, wiring PoolClient, transactions,
  or composing multiple queries; not for legacy v1 query code.
---

# v2 database queries (PgTyped)

## Where it lives

- **SQL and generated code**: `app/src/data/queries/<entity>/`
- **Imports from route code** should use `import … from "@data/…"` (see `app/tsconfig.json`). **Legacy votes** module lives in a misnamed file `legacy-queries/votes/index.ts.ts`; import it as `@data/legacy-queries/votes/index.ts` until that file is renamed.
- **One folder per entity** (e.g. `bets`, `predictions`, `users`).
- **Reference implementation**: read existing folders in that tree; follow the same shape as `bets/` and `predictions/`.

## Tooling

- **[PgTyped](https://pgtyped.dev/)** turns annotated SQL into TypeScript: parameter types, result row types, and `PreparedQuery` instances with a `.run(params, client)` method.
- **Config**: `app/pgtyped.config.json` — `srcDir` is `./src/data/queries`; each `*.sql` file emits a sibling **`{{name}}.queries.ts`** (e.g. `bets.sql` → `bets.queries.ts`).
- **Watch / regen**: from the `ndb2-api` package, `pnpm sql-watch` runs `pgtyped -w` with that config. Repo root **`pnpm dev`** runs API dev together with `sql-watch` via `concurrently`, so generated files update when SQL changes.
- **Do not hand-edit** `*.queries.ts`; change the `.sql` source and let PgTyped rewrite the generated file.

## SQL file (`<entity>.sql`)

- Name each query with a block comment: `/* @name camelCaseQueryName */` immediately above the statement.
- Use PgTyped parameter syntax (e.g. `:param!` for required scalars). See [PgTyped docs](https://pgtyped.dev/) for annotations and types.

## Generated file (`<entity>.queries.ts`)

- Appears next to the `.sql` file with the same basename.
- Exports `PreparedQuery` constants and `I…Params` / `I…Result` interfaces.
- Execute with **`.run(params, dbClient)`** where `dbClient` is a `pg` `PoolClient` (same client must be used for all statements inside one transaction).

## Wrapper module (`index.ts`)

- **Default export** an object of **curried** functions: each is `(dbClient: PoolClient) => async (...) => …`.
- **Imports**: pull generated queries from `./*.queries.ts` (and from other entities’ `*.queries.ts` or their `index` wrappers when composing behavior).
- **Responsibilities**:
  - Map DB rows to API/DTO shapes, handle empty results, orchestrate `Promise.all` for independent reads, etc.
  - **Compose** multiple generated `.run` calls or other entity wrappers into one operation.
- **Transactions**: use `await dbClient.query("BEGIN")`, `COMMIT`, and `ROLLBACK` on the same `dbClient`; inside the try block call generated queries and/or wrappers that accept that client. Example pattern: `queries/predictions/index.ts` (`create` — insert then `betsQueries.add(dbClient)(…)` then commit).

## Call sites

- Routes obtain a client (e.g. via `getDbClient` in v2) and pass it into the wrapper: `someQueries.method(dbClient)(args)`.

## Checklist for a new entity

1. Add `app/src/data/queries/<entity>/<entity>.sql` with `@name` queries.
2. Ensure `sql-watch` (or a one-off `pgtyped` run) has generated `<entity>.queries.ts`.
3. Add `index.ts` with the default-export object of `(dbClient) => …` wrappers.
4. Keep business logic and DTO assembly in `index.ts`; keep SQL in `.sql` only.

## Related skills (domain + triggers)

- **`ndb2-game-mechanics`** — prediction lifecycle, drivers, snoozes, monitors.
- **`ndb2-scoring-seasons`** — wagers, ratios, payouts, seasons, `valid` / `season_applicable`.
- **`ndb2-denormalized-data`** — trigger graph for derived columns; required when migrations touch `predictions` / `bets` / `seasons`.
