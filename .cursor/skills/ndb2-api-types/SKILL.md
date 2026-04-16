---
name: ndb2-api-types
description: >-
  Describes the @offnominal/ndb2-api-types package (types/src/v2): Entities,
  Endpoints, Webhooks, Errors, Utils, and semver bumps in package.json for npm
  releases. Use when editing shared API TypeScript types, adding entities or
  endpoint namespaces, webhook payloads, or error codes, or when a PR touches
  the types package.
---

# NDB2 API types package (`@offnominal/ndb2-api-types`)

## Role

The **`types/`** workspace package is published to **npm**. Consumers import the v2 surface as:

`import * as API from "@offnominal/ndb2-api-types/v2"`

The entry re-exports namespaces from `types/src/v2/index.ts`. Keep types aligned with the HTTP API, webhooks, and any shared contracts the API and clients rely on.

## Top-level namespaces (`types/src/v2/index.ts`)

| Export          | Purpose                                                                                                                                                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`Entities`**  | Domain shapes (resources as returned by the API or embedded in payloads). Organized by resource under `entities/<name>.ts`, aggregated in `entities/index.ts`.                                                                                                          |
| **`Endpoints`** | Per-route request/response types. Organized by area under `endpoints/<area>.ts`, aggregated in `endpoints/index.ts`. Each route is usually a **namespace** with `Data`, `Response` (`APIResponse<Data>`), and **`Body`** (or similar) when part of the public contract. |
| **`Webhooks`**  | Webhook event names, per-event payload types, discriminated **`Payload`**, and runtime helpers (e.g. `isWebhookPayloadV2`). Lives in `webhooks.ts`.                                                                                                                     |
| **`Errors`**    | Numeric error codes and the `NDB2APIError` union; see `errors.ts` and the comment legend for code ranges by resource.                                                                                                                                                   |
| **`Utils`**     | Shared wire shapes: `SuccessResponse`, `ErrorResponse`, `ErrorInfo`, `APIResponse<T>`, etc.                                                                                                                                                                             |

When adding a new **resource area**, extend the right subtree (`entities/index.ts`, `endpoints/index.ts`) so exports flow through `v2/index.ts`.

## Entities (`types/src/v2/entities/`)

- Model **stable resource shapes** (e.g. prediction, season) that appear in API responses or webhook `data`.
- Prefer importing entity types inside **Endpoints** and **Webhooks** instead of duplicating object shapes.
- Add a new file plus an export line in `entities/index.ts` when introducing a new resource module.

## Endpoints (`types/src/v2/endpoints/`)

- Mirror **HTTP routes**: one namespace per route, named consistently with existing patterns (e.g. `GET_ById`, `POST_Predictions`).
- **`Response`** should be `APIResponse<Data>` from `../utils` so success and error unions stay consistent.
- **`Body`** / query types belong here when they are part of the **published** contract for clients, not only server-side Zod inference.

## Webhooks (`types/src/v2/webhooks.ts`)

- **`WEBHOOK_EVENTS`** is the canonical list of event names; `WebhookEvent` is derived from it.
- Each event has a type under **`Events.*`** using **`BasePayload<eventName, dataShape>`** (`version: 2`, `date`, `data`, etc.).
- **`Payload`** is the union of all event payloads; keep it updated when adding or removing events.
- Update **`isWebhookPayloadV2`** (or equivalent guards) when wire validation rules change.

## Errors (`types/src/v2/errors.ts`)

- New domain errors: add a constant under the correct resource block and follow the numeric scheme in the file. **`NDB2APIError`** is inferred from **`Errors`**, so new keys on `Errors` extend the type automatically.

## Versioning and npm (`types/package.json`)

The package **version must be bumped** on any PR that changes **published** type definitions, constants, or exports under `types/` that ship in the npm artifact—so downstream installs get a new semver. Only bump the version once on a PR - all changes on one PR can be bundled on one published change.

| Bump      | When                                                                                                                                                    | Agent / automation                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **MAJOR** | **Breaking** changes: removed or renamed exports, changed types incompatibly, removed errors/events, etc.                                               | **Never bump major automatically.** Requires an explicit product decision and release plan. |
| **MINOR** | **New** functionality: new endpoints namespaces, new entity fields or types that are additive, new webhook events, new error codes, new exports.        | Appropriate default when adding surface area without breaking consumers.                    |
| **PATCH** | Small **non-breaking** fixes: typos in types, doc comments, narrowing that matches actual API behavior, internal refactors with identical public types. | Use for corrections that do not add new contract surface.                                   |

When in doubt between patch and minor, prefer **minor** if consumers could reasonably write new code against the change.

After editing types, run the **`types`** package **build** (`pnpm` in `types/` or monorepo scripts) to ensure TypeScript compiles before merge.

## Related skills

- **v2-api-endpoints** — wiring new HTTP routes and keeping `endpoints/` in sync.
- **v2-database-queries** — database layer only; entity shapes may still need updates here when API responses change.
