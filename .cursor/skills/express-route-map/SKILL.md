---
name: express-route-map
description: >-
  Describes the Express router dependency-injection pattern used in ndb2: a
  Route function receives a Router, registers handlers, and mapRoutes aggregates
  Route modules under path prefixes. Covers both app/src/api/v2 and app/src/web.
  Use when adding or reorganizing HTTP routes, mounting route modules, or
  mirroring the v2 route style in the HTML app.
---

# Express route map pattern (ndb2)

## Core idea

- **`Route`**: `(router: Router) => void` — the route module **does not** create its own `Router`. It **receives** a `router` and calls `router.get`, `router.post`, etc. Paths are **relative to the mount prefix** parent `index` files choose.
- **`mapRoutes`**: takes an array of `Route` functions, creates **one** `express.Router()`, runs each route on it, returns that router for `parent.use(prefix, mappedRouter)`.

This keeps registration colocated per feature file while aggregation stays in a small `index`.

## Shared helper

- **`app/src/shared/routerMap.ts`** exports `Route` and `mapRoutes`. Import with the path alias: `import { Route, mapRoutes } from "@shared/routerMap"` (see `app/tsconfig.json` `paths` and `docs/frontend/project-structure.md`).

## v2 JSON API

- **Mount**: `app/src/api/v2/index.ts` — `import { mapRoutes } from "@shared/routerMap"`; `apiV2Router.use("/seasons", mapRoutes([getAllSeasons]))`, same for `/predictions` with a longer array.
- **Per-route file**: e.g. `app/src/api/v2/routes/seasons/get.ts` — `import { Route } from "@shared/routerMap"`; `export const getAllSeasons: Route = (router) => { router.get("/", …); }` so the effective path is **`/api/v2/seasons/`** (prefix + `/`).
- **Errors / async**: use `wrapRouteWithErrorBoundary` and the v2 `errorHandler` as documented in **`v2-api-endpoints`** — do not duplicate that guidance here.

## Web (Kitajs HTML / HTMX)

- **Mount**: `app/src/web/routes/index.ts` — `webRouter.use("/", mapRoutes([…]))` aggregates feature **`handler.ts`** modules; add more prefixes later (e.g. `webRouter.use("/predictions", mapRoutes([…]))`).
- **Per feature** (colocation): `app/src/web/routes/<area>/` — **`page.tsx`** (snake_case page function, e.g. `home_page`), **`handler.ts`** (exports a **`Route`** such as `Home`), **`tests/`** (route-level supertest), **`components/`** (snake_case `.tsx` + colocated **`*.test.ts`**). Shared JSX → **`app/src/web/shared/components/`** when reused. Use `res.type("html").send(await Promise.resolve(home_page(props)))` when the tree may be async.
- **Streaming async subtrees**: **`renderToStream`** + **`Suspense`** from `@kitajs/html/suspense`, `stream.pipe(res)` — see **`kitajs-html-web`** and `app/src/web/routes/demo/suspense/handler.ts`.

## Conventions

- **New v2 endpoint**: add a `Route` in `routes/<area>/…`, import it in `api/v2/index.ts`, append to the right `mapRoutes([...])` for that prefix. Follow **`v2-api-endpoints`** for validation, responses, and types.
- **New web feature**: add `routes/<area>/page.tsx`, `handler.ts`, optional `components/`, optional `tests/`, export a **`Route`** from `handler.ts`, import it in `web/routes/index.ts`, append to `mapRoutes([...])`.
- **Naming**: v2 keeps verb-style exports (`getAllSeasons`, …). **Web** exports a **PascalCase** **`Route`** name from **`handler.ts`** (`Home`, `SuspenseDemo`). **Kitajs components** in **`components/`** and page functions in **`page.tsx`** use **snake_case** (see **`kitajs-html-web`**).

## Quick reference

```ts
// app/src/shared/routerMap.ts
export type Route = (router: Router) => void;
export const mapRoutes = (routes: Route[]) => { /* forEach(route => route(router)); return router; */ };

// Feature route module
export const getExample: Route = (router) => {
  router.get("/", handler);
};

// index aggregation
parentRouter.use("/prefix", mapRoutes([getExample, postExample]));
```
