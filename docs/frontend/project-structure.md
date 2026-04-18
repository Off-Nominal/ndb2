# Frontend project structure plan (Kitajs HTML + HTMX + CUBE CSS)

This document proposes a repo structure for serving **HTML pages** and the **v2 JSON API** from the same `app` service, while keeping shared concerns (DB queries, domain helpers) version-agnostic.

**Rendering:** Server HTML is **Kitajs Html** (`@kitajs/html`) only — JSX/TSX lives next to handlers under **`app/src/web/routes/<area>/`** (`page.tsx`, `components/`). We are **not** using EJS or another Express view engine; there is no `views/` tree or `res.render()` pipeline.

## Status (as of this doc)

| Area | Status | Notes |
|------|--------|--------|
| Single Express app (HTML + JSON) | **Done** | `app/src/server/createApp.ts` composes `mountWeb` + `mountJsonApi`; `app/src/index.ts` is bootstrap + listen + monitors only. |
| Shared `data/` queries (PgTyped) | **Done** | `app/src/data/queries/**`; v2 routes import from there. |
| `getDbClient` in `data/db` | **Done** | v2 uses it; v1 still uses legacy middleware `getDbClient` (optional future convergence). |
| Shared route helper | **Done** | `app/src/shared/routerMap.ts` (`Route`, `mapRoutes`) for v2 and web. |
| JSON API mount + scoped middleware | **Done** | `app/src/api/mountJsonApi.ts`: API-key auth + `validateContentType` apply only to API router, not HTML. |
| Web scaffold (Kitajs HTML, HTMX, static) | **Done** | `app/src/web/mountWeb.ts`, `routes/<area>/page.tsx` + `handler.ts` + `components/` + `tests/`, `public/` (HTMX via `vendor-htmx` in `app/package.json`). |
| Web route pattern | **Done** | Feature colocation; each area exports a **`Route`** from `handler.ts` (e.g. `Home`, `SuspenseDemo`); `mapRoutes` in `web/routes/index.ts` (see `.cursor/skills/express-route-map`, `kitajs-html-web`). |
| `web/middleware/`, `web/viewModels/` | **Stub** | Directories reserved; auth guards and view-models not implemented yet. |
| `data/services/`, `data/types/` | **Not started** | Optional internal layers from the plan below. |
| CUBE CSS + design-token build | **Not started** | See `design.md`, `cube-css.md`. |
| Full page set + auth | **Not started** | See `routes.md`, `authentication.md`. |
| HTMX component routes + Suspense demo | **Started** | e.g. `GET /home/lucky-number`, `/demo/suspense` (streaming); more HTMX-targeted components as features land. |

## Goals

- **Single server** (Express) serves both:
  - HTML pages at REST-y paths like `/predictions/:id`
  - JSON API at `/api/v2/predictions/:id`
- **No “API calls to self”**: HTML routes and API routes should call the same underlying query/service functions, not fetch each other over HTTP.
- **Shared data layer**: DB queries should not be “v2-only” if the web UI uses them too.
- **Clear separation**: web rendering concerns live in `web/`; API concerns live in `api/v2/`.

## TypeScript path aliases (`app/tsconfig.json`)

The API package resolves:

| Alias | Maps to |
|-------|---------|
| `@shared/*` | `app/src/shared/*` |
| `@data/*` | `app/src/data/*` |
| `@domain/*` | `app/src/domain/*` |

Example: `import { mapRoutes } from "@shared/routerMap";`

- **JSX**: `app/tsconfig.json` sets `jsx: "react-jsx"` and `jsxImportSource: "@kitajs/html"`; **`@kitajs/ts-html-plugin`** adds editor XSS hints. **Vitest** sets matching `esbuild.jsxImportSource` in `vitest.*.config.ts`.
- **HTMX + types**: `app/src/web/htmx_kitajs.d.ts` augments **`JSX.HtmlTag`** with [htmx core attributes](https://htmx.org/reference/#attributes) (per [Kita extending JSX](https://html.kitajs.org/guide/jsx/extending-types)).
- **`pnpm run build`** runs **`tsc-alias`** after `tsc` so emitted `dist/**/*.js` uses relative paths Node can load (for path aliases).
- **Vitest** uses the same aliases via `app/vitest.shared.ts` (`resolve.alias`).

## Web naming and tests

- **Kitajs components** use **snake_case** for TypeScript names and filenames (e.g. `lucky_number.tsx`, `export function lucky_number`, `export type lucky_number_props`). This differs from typical React PascalCase; it matches the rest of the ndb2 TS codebase. For **async** children inside **`Suspense`**, prefer a **function call** `{delayed_snippet({ ... })}` rather than a lowercase JSX tag (the JSX transform treats lowercase tags as built-in elements).
- **Route-level tests:** each feature folder has a **`tests/`** directory next to `handler.ts` (e.g. `routes/home/tests/home.test.ts`) for **page and HTTP handler** coverage (supertest against `mountWeb`, or focused router tests).
- **Component tests:** colocated with the component — `components/banana.tsx` pairs with **`components/banana.test.ts`** (Vitest picks up `**/*.test.ts`).

App-wide static wiring (e.g. `GET /assets/htmx.min.js`) stays in **`mountWeb.test.ts`** or a small `web/tests/` module if it grows.

## Proposed `app/src` layout

High-level shape:

- `app/src/index.ts` (process bootstrap: DB check, `createApp()`, listen, domain monitors)
- `app/src/server/createApp.ts` (Express factory: global middleware, health, `mountWeb`, `mountJsonApi`, 404)
- `app/src/api/mountJsonApi.ts` (API-key JSON surface: v1 + v2 under one router)
- `app/src/api/v1/` (legacy API router; maintenance mode)
- `app/src/api/v2/` (JSON API only; “future” API)
  - `routes/` (route handlers)
  - `middleware/` (validate, error handler, etc.)
  - `validations/` (zod schemas)
  - `utils/` (**v2-specific** http/route utils only)
- `app/src/web/` (HTML app: Kitajs HTML + HTMX)
  - `routes/` — one folder per URL area (`home/`, `predictions/`, …): **`page.tsx`**, **`handler.ts`**, **`tests/`** (route/page HTTP tests), **`components/`** (snake_case `.tsx` + colocated **`*.test.ts`**)
  - `shared/components/` (cross-area Kitajs components; add when needed)
  - `middleware/` (auth guards, etc.)
  - `viewModels/` (map domain objects → page-friendly props / view shapes)
  - `public/` (static assets: generated CSS, images)
- `app/src/shared/` (cross-cutting, non-domain helpers)
  - `routerMap.ts` (`Route`, `mapRoutes` for v2 and web)
- `app/src/data/` (shared, version-agnostic “backend” layer)
  - `db/` (db client helpers, transactions)
  - `queries/` (PgTyped query modules + small wrappers)
  - `services/` (optional: cross-cutting domain logic composed from queries)
  - `types/` (internal-only types that aren’t part of `@offnominal/ndb2-api-types`)

### What “graduates” out of `api/v2/`

#### `api/v2/queries` → `data/queries`

**Done:** `app/src/api/v2/routes/**` imports from `app/src/data/queries/**` (PgTyped `srcDir` is `app/src/data/queries`). No long-lived `api/v2/queries` re-export layer.

#### `api/v2/utils` → split shared vs v2-only

Not everything in `app/src/api/v2/utils` should be shared:
- **shared-worthy** (likely):
  - `getDbClient` (DB access helper) → `app/src/data/db/getDbClient`
- **v2-only** (keep under `api/v2/utils`):
  - `response` (JSON response helpers)
- **Shared** (Express route composition, not JSON-specific):
  - `Route` / `mapRoutes` → `app/src/shared/routerMap.ts` (used by v2 and `web/`)

Principles:
- If a utility is about **HTTP/JSON API behavior** (response envelope, v2-only helpers), it stays in `v2/utils`.
- If it is about **data access / domain logic**, it belongs in `data/`.
- If it is **shared Express routing composition** used by both HTML and JSON routers, it lives in `shared/` (e.g. `routerMap.ts`).

## Web routing conventions

We want predictable parity between page URLs and API URLs:

- Page: `/predictions/:id`
- API: `/api/v2/predictions/:id`

HTMX-targeted components (small HTML responses, no full document):
- Prefer paths under the same resource prefix as the feature, e.g.
  - `/predictions/:id/...` or `/home/lucky-number`
- Name and think of these as **components** (React-like), not “partials.”

Rule of thumb:
- Full page routes render a layout + **`page.tsx`** (full `<html>` document where appropriate).
- HTMX `hx-get` routes return **component HTML** only (no `<html>`), from the same feature folder’s **`components/`** or an extra `router.get` in **`handler.ts`**.

## Shared types strategy

- External API response/request types continue to live in `types/` (`@offnominal/ndb2-api-types`).
- Web pages should prefer **domain objects/view models** rather than depending directly on API response types.
  - It’s fine to reuse the shared types where it genuinely helps, but the web UI shouldn’t be forced to mirror API wire shapes.

## Build and assets

The `web/public/` directory holds static assets for pages (scripts, future CSS). **Today:** `htmx.min.js` is copied from `htmx.org` via `pnpm run vendor-htmx` (also runs on `postinstall` and as part of `build`); the file is gitignored under `src/web/public/`.

**Still to decide:** generated token CSS (from JSON design tokens), CUBE utilities/compositions, and whether those artifacts are committed or produced in CI/build.

