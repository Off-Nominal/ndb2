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

- **Mount**: `app/src/web/routes/index.ts` — `webRouter.use("/", mapRoutes([…]))` aggregates feature **`handler.tsx`** modules; add more prefixes later (e.g. `webRouter.use("/predictions", mapRoutes([…]))`).
- **Per feature** (colocation): `app/src/web/routes/<area>/` — **`page.tsx`** (PascalCase page component, e.g. `HomePage`), **`handler.tsx`** (exports a **`Route`** such as `Home`; JSX for `<HomePage … />`, `<LoginPage … />`, etc.), **`tests/`** (route-level supertest), **`components/<name>/`** (one directory per component: `name/name.tsx`, optional colocated CSS and `name.test.ts(x)`, **`index.ts`** barrel — see **`kitajs-html-web`**). Shared JSX → **`app/src/web/shared/components/<name>/`** when reused. Use `res.type("html").send(await Promise.resolve(<HomePage … />))` when resolving HTML.
- **Streaming async subtrees**: **`renderToStream`** + **`Suspense`** from `@kitajs/html/suspense`, `stream.pipe(res)` — see **`kitajs-html-web`** and `app/src/web/routes/demo/suspense/handler.tsx`.

## Conventions

- **New v2 endpoint**: add a `Route` in `routes/<area>/…`, import it in `api/v2/index.ts`, append to the right `mapRoutes([...])` for that prefix. Follow **`v2-api-endpoints`** for validation, responses, and types.
- **New web feature**: add `routes/<area>/page.tsx`, `handler.tsx`, optional `components/`, optional `tests/`, export a **`Route`** from `handler.tsx`, import it in `web/routes/index.ts`, append to `mapRoutes([...])`.
- **Naming**: v2 keeps verb-style exports (`getAllSeasons`, …). **Web** exports a **PascalCase** **`Route`** name from **`handler.tsx`** (`Home`, `SuspenseDemo`). **Kitajs** page/components use **PascalCase** exports with **kebab-case** component filenames (see **`kitajs-html-web`**).

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

## Related

- **`middleware-patterns`** — request-scoped context on the web app (prefer Async Local Storage over mutating `req`).
- **`middleware-naming`** — short `kebab-case` filenames (no redundant `web` / `middleware` in the name), `camelCase` exports.
