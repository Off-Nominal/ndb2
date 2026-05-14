---
name: input-validation
description: >-
  Prefer Zod for runtime validation of env vars, HTTP inputs, and parsed external data.
  Instructs checking the installed library version (e.g. Zod 3 vs 4) and matching official
  docs and examples to that version so APIs are not outdated or deprecated. Covers ndb2
  shared validation layout (@shared/validation/domain vs http, route-local composition).
  Use when adding validation, parsing request bodies or query strings, validating environment
  configuration, or refactoring manual checks into schemas.
---

# Input validation (Zod + version alignment)

## Default: use Zod

For **runtime** validation in TypeScript (not compile-time types alone), prefer **[Zod](https://zod.dev/)** when the project already depends on it:

- Environment variables and feature flags
- Request bodies, query params, route params, and headers (compose with existing HTTP handlers)
- JSON or structured payloads from external APIs before use in application code
- Normalizing stringly-typed values (e.g. `"48"` → positive number) with clear failure modes

Use `safeParse` when invalid input should yield a controlled branch (fallback, 400, etc.); use `parse` when invalid input should throw after you intend to fail fast.

Pair Zod output types with TypeScript via `z.infer<typeof schema>` where it reduces duplication.

## Match documentation to the installed version (required)

Zod’s public API **changes across major versions** (e.g. Zod 3 vs Zod 4). Training data and generic web examples often target an older major. **Do not** copy patterns from memory or random search results without confirming they apply to **this** repo’s Zod.

**Before writing or changing Zod code:**

1. **Read the installed version** from the relevant `package.json` (e.g. `app/package.json` → `"zod": "^4.x"` or the resolved version in the lockfile if you need exact patch).
2. **Use docs for that major version** — e.g. official site paths or release notes for v3 vs v4. If using web search, include the major version in the query (e.g. “Zod 4 coerce number”).
3. **Prefer the local contract of truth**: if unsure whether a method exists (e.g. chaining helpers, `z.coerce`, refinements), check **`node_modules/zod`** typings or the package’s README/changelog for the installed version instead of guessing.
4. **Avoid deprecated or removed APIs** — if a snippet uses an old API, find the current equivalent under the correct major version rather than pasting legacy code.

If the repo upgrades Zod, re-validate existing schemas against the new major’s migration notes; do not assume drop-in compatibility.

## ndb2 shared validation layout (`app/src/shared/validation/`)

Wire-level Zod helpers live under **`@shared/validation`** — **not** under `app/src/api/v2` (there is **no** `api/v2/validations` barrel; JSON routes import **`@shared/validation`** directly).

| Module | Import alias | Role |
|--------|----------------|------|
| **`http.ts`** | `@shared/validation/http` | Express **`req.query`** normalization: **`queryParamScalar`**, **`queryParamMulti`**, **`optionalTrimmedStringSchema`**, **`preprocessQueryString*`** — pair these with inner schemas for GET forms and JSON query validation. |
| **`domain.ts`** | `@shared/validation/domain` | Cross-cutting **business/wire** primitives reused by v2 + web: Discord IDs, Postgres int IDs, **`createBooleanStringSchema`**, results list query shapes, **`seasonLookupParamSchema`**, etc. |
| **`constants.ts`** | (via domain / barrel) | e.g. **`POSTGRES_MAX_INT`**. |
| **`index.ts`** | `@shared/validation` | Barrel re-exporting **`domain` + `http`** when a single import is convenient. |

Prefer **`@shared/validation/domain`** and **`@shared/validation/http`** explicitly when the split matters; use the barrel when a route mixes both.

### Product domain vs `validation/domain.ts`

- **`app/src/domain/`** — orchestration, **`DomainFailure`**, game rules (see **domain-operations**).
- **`@shared/validation/domain`** — typed **HTTP/API wire** snippets (IDs, enums), not application use-case logic.

When several routes share **the same logical query fields** but different **composition rules** (e.g. v2 search vs HTML browse), put **per-field Zod schemas** in **`app/src/domain/<area>/`** (e.g. **`prediction-search-query-fields.ts`**) and **`z.object({ … })` at each handler** — do **not** export a giant shared object map unless there is a strong reason. **Transport-only refines** (e.g. “at least one filter” for REST only) stay **next to that route**.

### Web browse URLs (parse + canonical serialize)

For **`GET`** pages that mirror filters in the location bar, colocate **`parse*Query`** (**`safeParse`**) and **`serialize*Query`** (**`URLSearchParams`**, omit defaults for canonical URLs). Example: **`app/src/web/routes/predictions/parse-prediction-browse-query.ts`** + **`parse-prediction-browse-query.test.ts`**. Pair with **`input-validation`** + **`kitajs-html-web`** for placement.

## Other project touchpoints

- **`app/package.json`** — declares `zod`; use that version when reasoning about APIs.
- **App-wide environment variables** — validated once at boot in `app/src/config.ts`; see `.cursor/skills/app-config/SKILL.md`.
- **v2 routes** — **`validate`** + Zod; **v2-api-endpoints** skill for wiring and tests.

## What not to do

- Do not introduce **`app/src/api/v2/validations`** as a re-export wrapper — import **`@shared/validation`** from routes.
- Do not introduce a second validation library for the same layer without an explicit product decision.
- Do not validate with ad-hoc `Number(x)` / regex only when a schema would encode the rules and errors more clearly—unless the project already uses a different pattern in that file.

## Quick checklist

- [ ] Confirmed **Zod major version** from `package.json` (or lockfile).
- [ ] Examples and method names match **that** major’s documentation or local typings.
- [ ] Invalid input paths tested or handled (`safeParse`, fallbacks, HTTP errors) as appropriate.
