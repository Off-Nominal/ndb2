# Frontend project structure plan (EJS + HTMX + CUBE CSS)

This document proposes a repo structure for serving **HTML pages** and the **v2 JSON API** from the same `app` service, while keeping shared concerns (DB queries, domain helpers) version-agnostic.

## Goals

- **Single server** (Express) serves both:
  - HTML pages at REST-y paths like `/predictions/:id`
  - JSON API at `/api/v2/predictions/:id`
- **No “API calls to self”**: HTML routes and API routes should call the same underlying query/service functions, not fetch each other over HTTP.
- **Shared data layer**: DB queries should not be “v2-only” if the web UI uses them too.
- **Clear separation**: web rendering concerns live in `web/`; API concerns live in `api/v2/`.

## Proposed `app/src` layout

High-level shape:

- `app/src/index.ts` (app bootstrap; mounts routers)
- `app/src/api/v1/` (legacy API router; maintenance mode)
- `app/src/api/v2/` (JSON API only; “future” API)
  - `routes/` (route handlers)
  - `middleware/` (validate, error handler, etc.)
  - `validations/` (zod schemas)
  - `utils/` (**v2-specific** http/route utils only)
- `app/src/web/` (HTML app: EJS + HTMX)
  - `routes/` (page routes + HTMX fragment routes)
  - `middleware/` (auth guards, etc.)
  - `views/` (EJS templates: layouts, pages, partials)
  - `viewModels/` (map domain objects → template-friendly shapes)
  - `public/` (static assets: generated CSS, images)
- `app/src/data/` (shared, version-agnostic “backend” layer)
  - `db/` (db client helpers, transactions)
  - `queries/` (PgTyped query modules + small wrappers)
  - `services/` (optional: cross-cutting domain logic composed from queries)
  - `types/` (internal-only types that aren’t part of `@offnominal/ndb2-api-types`)

### What “graduates” out of `api/v2/`

#### `api/v2/queries` → `data/queries`

Today, `app/src/api/v2/routes/**` imports queries like `../../queries/predictions`.
That’s already “shared-ready” (it’s not using `../v2/queries/...` paths).

Plan:
- Move query entrypoints and generated PgTyped modules from `app/src/api/v2/queries/**` to `app/src/data/queries/**`.
- Keep the **public query API** the same shape (e.g. `predictions.*`, `users.*`), so both `v2` and `web` can import them.

Migration safety (recommended):
- Add a thin compatibility re-export layer so existing imports don’t all change at once:
  - keep `app/src/api/v2/queries/*` as re-exports pointing at `app/src/data/queries/*` temporarily
  - migrate imports gradually, then delete the re-export layer when clean

#### `api/v2/utils` → split shared vs v2-only

Not everything in `app/src/api/v2/utils` should be shared:
- **shared-worthy** (likely):
  - `getDbClient` (DB access helper) → `app/src/data/db/getDbClient`
- **v2-only** (keep under `api/v2/utils`):
  - `response` (JSON response helpers)
  - `routerMap` / route typing utilities tied to API route definitions

Principle:
- If a utility is about **HTTP/JSON API behavior**, it stays in `v2/`.
- If a utility is about **data access / domain logic**, it belongs in `data/`.

## Web routing conventions

We want predictable parity between page URLs and API URLs:

- Page: `/predictions/:id`
- API: `/api/v2/predictions/:id`

HTMX fragments:
- Prefer routing fragments under the same resource prefix, e.g.
  - `/predictions/:id/partials/...`
  - or `/predictions/:id/_fragment/...`

Rule of thumb:
- Full page routes render a layout + page template.
- Fragment routes render partial templates only (no layout), intended for HTMX swaps.

## Shared types strategy

- External API response/request types continue to live in `types/` (`@offnominal/ndb2-api-types`).
- Web templates should prefer **domain objects/view models** rather than depending directly on API response types.
  - It’s fine to reuse the shared types where it genuinely helps, but the web UI shouldn’t be forced to mirror API wire shapes.

## Build and assets (placeholder)

The `web/public/` directory is the natural home for:
- generated token CSS (from JSON design tokens)
- CUBE utilities/compositions
- any static assets required by templates

We’ll decide later whether those generated artifacts are committed or generated in CI/build.

