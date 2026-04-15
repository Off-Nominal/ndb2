---
name: v2-api-endpoints
description: >-
  Describes how to add Express routes under api/src/v2: validate middleware
  with Zod, shared vs local schemas, server errors via the v2 errorHandler,
  responseUtils for JSON bodies, colocated supertest suites, and updating
  types/src/v2/endpoints for response shapes. Use when creating or changing v2
  HTTP endpoints, route handlers, tests, validation wiring, or
  @offnominal/ndb2-api-types v2 exports; pairs with v2-database-queries for data
  access.
---

# v2 API endpoints

## Layout and wiring

- **Route modules**: `api/src/v2/routes/<area>/<verb>_<pathShape>.ts` (e.g. `routes/predictions/get_predictions_{predictionId}.ts`).
- **Route type**: export a `Route` from `../../utils/routerMap` — a function `(router: Router) => void` that registers methods on the sub-router.
- **Mounting**: import the route in `api/src/v2/index.ts`, add it to the `mapRoutes([...])` array for the appropriate prefix (`/predictions`, `/seasons`, etc.).
- **Error middleware**: `errorHandler` from `middleware/errorHandler` is already registered **last** on `apiV2Router` in `index.ts`. Do not remove or reorder it for new routes.

## Validation: always `validate` + Zod

Use **`validate`** from `api/src/v2/middleware/validate.ts` for every part of the request that the handler reads:

- **`params`** — path segments (e.g. `:prediction_id`).
- **`query`** — query string.
- **`body`** — JSON body.

Pass a Zod schema (or composed object) for each slice you need. Omitted keys mean that slice is not validated. On failure, `validate` responds **400** with `responseUtils.writeErrors` and the appropriate `API.Errors` codes (`MALFORMED_URL_PARAMS`, `MALFORMED_QUERY_PARAMS`, `MALFORMED_BODY_DATA`).

After `validate` runs, `req.params`, `req.query`, and `req.body` are the **parsed** types.

**References**: `get_predictions_{predictionId}.ts` (params), `post_predictions.ts` (body), `patch_predictions_{predictionId}_retire.ts` (params + body).

## Where to put Zod schemas

- **Shared across several routes** (IDs, Discord IDs, enums, reused field shapes): add or reuse exports in `api/src/v2/validations/` (`index.ts`, `constants.ts`). Import from `../../validations` in route files.
- **Used only by one route**: keep the schema in the same route module (private `const` next to the handler), as in `post_predictions.ts` (`createPredictionBodySchema`, `predictionTextSchema`).

## Errors: client (4xx) vs server (5xx)

- **Client / domain errors** (bad state, not found, forbidden, etc.): handle **inside the route**. Pick the status code, then `res.status(...).json(responseUtils.writeErrors([{ code: API.Errors.…, message: "…" }]))`. Use codes from `@offnominal/ndb2-api-types/v2`.
- **Server / unexpected errors**: do **not** hand-author 500 bodies in the happy path. Let the global **`errorHandler`** respond: it logs the error and returns a generic **500** with `API.Errors.SERVER_ERROR` via `responseUtils.writeErrors`.

Signal server failures with **`throw new Error("short descriptive message for logs")`** (or `next(new Error("…"))` if not using a wrapper). The message is for operators and logs; clients still get the generic error payload from `errorHandler`.

**Express 4**: unhandled promise rejections in `async` handlers do not reach `errorHandler` unless they are forwarded with **`next(err)`**. Use a small async wrapper (or equivalent) so any thrown `Error` or rejected promise becomes `next(err)`. Without that, add `try/catch` and call `next(error)` in the `catch` block.

## Responses: `responseUtils`

Import the default export from `api/src/v2/utils/response.ts`:

- **Success**: `res.json(responseUtils.writeSuccess(data, "optional message"))`.
- **Errors** (when handling 4xx in-route): `responseUtils.writeErrors([{ code, message }, …])`.

Do not use legacy v1 `../../../utils/response` in new v2 routes.

## Types package (`@offnominal/ndb2-api-types` v2)

When you add or change a v2 endpoint, update **`types/src/v2`** so consumers and the API stay aligned:

- **Per-area endpoint types**: `types/src/v2/endpoints/<area>.ts` (e.g. `predictions.ts`, `seasons.ts`). One **namespace per route**, named by method and path shape (see existing `GET_ById`, `POST_Predictions`, etc.).
- **Typical exports**: `Data` (success payload type, often an entity or array from `Entities`), `Response` as `APIResponse<Data>` from `../utils`, and **`Body`** (or query/params types if you need them shared) when the request shape is part of the public contract.
- **New area file**: add `types/src/v2/endpoints/<new>.ts` and export it from `types/src/v2/endpoints/index.ts` (same pattern as `Predictions` / `Seasons`).
- **Entities**: if the response introduces a new persisted shape, extend `types/src/v2/entities/` and use those types in the endpoint’s `Data`.

The API imports `API` from `@offnominal/ndb2-api-types/v2` for `Errors` and `Utils`; new endpoint namespaces live under `API.Endpoints.<Area>`.

## Tests

Add a **colocated** **`*.integration.test.ts`** next to the route module when the suite hits the database (e.g. `post_predictions.integration.test.ts` beside `post_predictions.ts`). Pure unit tests beside handlers can stay **`*.test.ts`**.

**Setup (match existing prediction routes):**

- Build a minimal **`express()`** app in `beforeAll`, register **only** the route under test by passing the app into your exported `Route` (same pattern as `get_predictions_{predictionId}.integration.test.ts` / `post_predictions.integration.test.ts`).
- For handlers that read JSON bodies, use **`app.use(express.json())`** before registering the route.
- When the route uses **`getDbClient`** / the real pool, call **`useEphemeralDb({ users, seasons, predictions })`** once at the top of the file (from **`../../../test/with-ephemeral-db`**) and compose data with **`defaultUsers()`**, **`defaultPastCurrentFutureSeasons()`**, and **`prediction(id, { ... })`** from **`../../../test/factories/{users,seasons,predictions}`** — defaults cover common cases; override fields on `prediction()` for the shape you need. Each file should inline only the rows that suite requires.

**Assertions:**

- Use **`supertest`** (`request(app).get/post/...`) for HTTP calls.
- Import **`@offnominal/ndb2-api-types/v2`** as **`API`** to assert **`API.Errors.*`** codes and type error entries as **`API.Utils.ErrorInfo`** where helpful.
- Cover **validation failures** (400 + `MALFORMED_*` or field messages), **domain errors** (expected 4xx + correct `code`), and **success** shapes (`data`, important fields). For side effects (e.g. **`eventsManager.emit`**), use **Vitest** **`vi.spyOn`** like `post_predictions.integration.test.ts`.

**References**: `get_predictions_{predictionId}.integration.test.ts`, `post_predictions.integration.test.ts`, `patch_predictions_{predictionId}_retire.integration.test.ts`, `delete_predictions_{predictionId}_trigger.integration.test.ts`.

## Checklist for a new endpoint

1. Add Zod schemas (shared in `validations/` or local in the route file).
2. Export a `Route` that chains `validate({ params?, query?, body? })` before the handler when any of those are used.
3. Obtain `dbClient` with `getDbClient(res)` when touching the DB; pass it into query wrappers per the v2-database-queries skill.
4. Return **4xx** with explicit `code` + `message` via `responseUtils.writeErrors`.
5. Forward **5xx** to `errorHandler` (throw `Error` / `next(err)` with a loggable message, not user-facing copy).
6. Register the route in `api/src/v2/index.ts` inside `mapRoutes`.
7. Update `types/src/v2/endpoints/` (and `entities/` if needed); export new area modules from `endpoints/index.ts`.
8. Add `*.integration.test.ts` beside the route: supertest, `useEphemeralDb({ ... })` with factory-composed seed when using the DB, and cases for validation / domain errors / success (see **Tests** above).
