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

## Web (EJS / HTMX)

- **Mount**: `app/src/web/routes/index.ts` — `webRouter.use("/", mapRoutes([Home]))`; add more prefixes later (e.g. `webRouter.use("/predictions", mapRoutes([…]))`).
- **Per-page / feature**: e.g. `app/src/web/routes/home/get.ts` — export the page as a **PascalCase** name matching the page (`Home`, `Predictions`, …): `export const Home: Route = (router) => { router.get("/", …); }` and `res.render(...)`.

## Conventions

- **New v2 endpoint**: add a `Route` in `routes/<area>/…`, import it in `api/v2/index.ts`, append to the right `mapRoutes([...])` for that prefix. Follow **`v2-api-endpoints`** for validation, responses, and types.
- **New web page**: add a `Route` under `web/routes/<area>/…`, import in `web/routes/index.ts`, add to the appropriate `mapRoutes` under the right prefix.
- **Naming**: v2 keeps verb-style exports (`getAllSeasons`, `createPrediction`, …). **Web** uses **PascalCase page names** (`Home`, …) in route modules; filenames can stay `get.ts` or similar under a folder per page.

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
