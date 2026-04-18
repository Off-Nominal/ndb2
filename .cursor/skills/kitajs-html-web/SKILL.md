---
name: kitajs-html-web
description: >-
  NDB2 web rendering with @kitajs/html: TSX → HTML strings, feature-colocated
  page.tsx + handler.ts + components/, HTMX-targeted components, Suspense +
  renderToStream for chunked responses. Use when adding or changing server-rendered
  UI under app/src/web; not for React client apps or EJS.
---

# Kitajs HTML (web) — ndb2 patterns

**Decision:** Server-rendered HTML for `app/src/web` uses **[Kitajs Html](https://github.com/kitajs/html)** (JSX/TSX compiled to HTML strings). Do **not** add Express view engines, EJS, or similar.

**Layout:** Features live under **`app/src/web/routes/<area>/`** (e.g. `home/`, `predictions/`). Each area typically has:

- **`page.tsx`** — main document or screen (Kitajs component returning HTML).
- **`handler.ts`** — Express `Route`: `router.get(...)`, `res.type("html")`, etc.
- **`components/`** — components used only by that area (React-like colocation).

Cross-cutting UI → **`app/src/web/shared/components/`** (create when the first reuse appears).

Official concepts: [Async components and Suspense](https://html.kitajs.org/guide/introduction#async-components-and-suspense) (v5 docs; API matches `@kitajs/html` **v4.x** in this repo via `@kitajs/html/suspense`).

## Tooling

- **`app/tsconfig.json`**: `jsx: "react-jsx"`, `jsxImportSource: "@kitajs/html"`, **`@kitajs/ts-html-plugin`** for XSS-oriented editor diagnostics.
- **Vitest**: `esbuild.jsxImportSource: "@kitajs/html"` in `vitest.*.config.ts` so tests compile TSX the same way.
- **Imports**: Page/components from `@kitajs/html` (JSX runtime). Streaming helpers from **`@kitajs/html/suspense`** (`Suspense`, `renderToStream`).

## Static HTML

1. **`page.tsx`** — export a function that returns `JSX.Element` (a `string` or `Promise<string>` at runtime).

2. **`handler.ts`** — import `./page`, call `await Promise.resolve(HomePage(props))` when the tree might be async, then `res.type("html").send(html)`.

3. **HTMX** — expose small **component** responses (no `<html>` wrapper) on paths scoped to the feature, e.g. **`GET /home/lucky-number`**, and point `hx-get` at that URL. Prefer **component** naming, not “partial”.

4. **`.ts` handlers** — avoid JSX in `*.ts`; use `createElement` from `@kitajs/html` when building elements in the handler (e.g. streaming):

   ```ts
   import { createElement } from "@kitajs/html";
   createElement(SuspenseDemoPage, { rid });
   ```

## Streaming + Suspense

Use when slow I/O should not block the entire document: send shell + fallbacks first, then stream replacement chunks (chunked transfer encoding).

1. **Async child** — return type **`Promise<string>`** (not `Promise<JSX.Element>` — Kita’s `JSX.Element` is `string | Promise<string>`).

2. **Boundaries** — wrap async children in **`Suspense`** from `@kitajs/html/suspense`. Each boundary shares the same **`rid`** for that HTTP request.

3. **Handler** — **`renderToStream`** with **`(rid) => createElement(Page, { rid })`**, pipe to **`res`**, handle **`error`** on the stream.

   Reference: `app/src/web/routes/demo/suspense/handler.ts`, `page.tsx`, `components/DelayedSnippet.tsx`.

## XSS

User-controlled strings in markup should be escaped. Prefer the **`safe`** attribute on the innermost text container when you need escaping, or the `e` / `escape` helpers from `@kitajs/html`. Rely on **`@kitajs/ts-html-plugin`** and team review for unsafe children.

## Related

- Route registration: **`express-route-map`** (`Route`, `mapRoutes`, `web/routes/index.ts`).
- Stack and folders: **`docs/frontend/project-structure.md`**, **`docs/frontend/overview.md`**.
