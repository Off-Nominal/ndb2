---
name: domain-operations
description: >-
  Extracts multi-step business rules from Express handlers into
  app/src/domain/<area>/ modules: DomainFailure + typed API error codes (no
  HTTP), success metadata only, reload/events at transports. Use when adding or
  refactoring domain functions (e.g. placeBet), migrating a fat v2 route or web
  handler, splitting integration tests between domain and HTTP, or deciding
  where eventsManager.emit and getById reload belong.
---

# Domain operations (business logic outside HTTP)

## Goal

- **Domain**: orchestrates queries + pure rules; returns **`ok: true`** with **metadata** or **`ok: false`** with **`API.Errors`-compatible `code` + `message`**.
- **HTTP / HTML**: validation (Zod), **status codes**, **`responseUtils`**, reloading projections for the wire, **`eventsManager.emit`** when those depend on freshly loaded data.

Reference implementation: **`app/src/domain/bets/place-bet.ts`**, wired from **`app/src/api/v2/routes/predictions/post_predictions_{predictionId}_bets.ts`**.

## Building blocks

| Piece | Location |
|-------|----------|
| **`DomainFailure<Code>`** | **`app/src/domain/domain-failure.ts`** — `{ ok: false, code, message }`; **`Code`** defaults to **`API.Utils.ErrorInfo["code"]`**. |
| Per-operation **error code union** | Same module as the function (e.g. **`PlaceBetErrorCode`**) — documents every **`API.Errors.*`** this call can return. |
| **Queries** | **`@data/queries/...`** (`PreparedQuery` wrappers). Domain calls these; it does not embed SQL. |
| **Filenames under `domain/`** | **Kebab-case** — **domain-kebab-case** skill. |

## What belongs in domain vs endpoint

**Domain**

- Load rows needed for **rules** (e.g. existing prediction + bets to check open / window / no-change).
- Writes via query wrappers (**`betsQueries.add`**, etc.).
- Return **`PlaceBetResult`-style** unions (`PlaceBetSuccess` \| **`PlaceBetFailure`**).

**Endpoint (v2, web, jobs)**

- **`validate`** / CSRF / auth.
- **`placeBet(dbClient, { … })`** then **`if (!result.ok)`** → pick **HTTP status** from **`result.code`**, **`writeErrors([{ code: result.code, message: result.message }])`**.
- After **`ok: true`**: **`predictions.getById`** (or equivalent) for the response payload; **`eventsManager.emit`** with that payload when webhooks need the full projection (**events-manager** skill).
- **500 + `SERVER_ERROR`** for invariant gaps (e.g. row missing after a successful write) if you keep that check at the transport.

## Migrating an existing endpoint (e.g. POST predictions / bets)

Work incrementally; keep **`*.integration.test.ts`** green.

1. **Inventory** the handler: validation vs reads vs branches vs writes vs reload vs **`emit`** vs response mapping.
2. **Add types** in **`app/src/domain/<area>/<verb>-<noun>.ts`**: **`FooErrorCode`** union, **`FooSuccess`**, **`FooFailure`**, **`FooResult`**, **`FooInput`**.
3. **Implement `async function foo(dbClient, input): Promise<FooResult>`** — move branches that only need **`PoolClient`** + config + queries. Leave **`httpStatus`** behind.
4. **Thin the route**: validate → **`foo`** → map failure/success; move reload + **`emit`** here if they were only needed for JSON/webhooks.
5. **Split tests**: domain **`*.integration.test.ts`** with **`useEphemeralDb`** + **`pool.connect()`** (see **`place-bet.integration.test.ts`**); route suite keeps **malformed requests**, **status + body smoke**, and transport-only concerns.
6. **Second caller** (e.g. web **`POST /predictions/bet/:id`**) calls the **same** domain function; only the outer mapping differs.

## Tips

- Prefer **one domain function per use case** (`placeBet`) over a grab-bag **`betsService`** until patterns stabilize.
- If **`SERVER_ERROR`** is only “should never happen,” keep handling at the **endpoint** so domain **`ErrorCode`** unions stay meaningful for product rules.
- Reuse **`API.Errors`** numeric codes end-to-end so v2 **`writeErrors`** and web partials stay aligned (**ndb2-api-types** skill).

## Related skills

- **domain-kebab-case** — filenames under **`app/src/domain`**.
- **v2-api-endpoints** — Zod **`validate`**, **`responseUtils`**, **`getDbClient`**, colocated route tests.
- **input-validation** — **`@shared/validation`** (**`domain`** vs **`http`**), route-local **`z.object`** composition for shared query fields.
- **v2-database-queries** — PgTyped wrappers the domain calls.
- **events-manager** — **`emit`** payloads and webhook listeners.
