---
name: kitajs-html-web
description: >-
  NDB2 web rendering with @kitajs/html: snake_case Kitajs components, feature
  folders (page.tsx, handler.ts, tests/, components/*.test.ts), HTMX, Suspense +
  renderToStream. Use when adding or changing server-rendered UI under
  app/src/web; not for React client apps or EJS.
---

# Kitajs HTML (web) — ndb2 patterns

**Decision:** Server-rendered HTML for `app/src/web` uses **[Kitajs Html](https://github.com/kitajs/html)** (JSX/TSX compiled to HTML strings). Do **not** add Express view engines, EJS, or similar.

**Layout:** Features live under **`app/src/web/routes/<area>/`**. Each area typically has:

- **`page.tsx`** — main document or screen; export **`home_page`**, **`suspense_demo_page`**, etc. (snake_case). Props types **`home_page_props`**, …
- **`handler.ts`** — Express **`Route`**; export name stays **PascalCase** (`Home`, `SuspenseDemo`) to match `mapRoutes` aggregation.
- **`tests/`** — **route/page-level** tests (e.g. supertest on `mountWeb` for that feature’s URLs).
- **`components/`** — area-local Kitajs modules; **snake_case** filenames and exports (`lucky_number.tsx`, `delayed_snippet.tsx`).

Cross-cutting UI → **`app/src/web/shared/components/`** (create when the first reuse appears).

Official concepts: [Async components and Suspense](https://html.kitajs.org/guide/introduction#async-components-and-suspense) (v5 docs; API matches `@kitajs/html` **v4.x** via `@kitajs/html/suspense`).

## Naming (snake_case)

- **Components and props:** `lucky_number`, `lucky_number_props`; file `lucky_number.tsx`.
- **Why not `<lucky_number />`?** The TS JSX transform treats **lowercase** tags as intrinsic HTML. Use **`lucky_number(props)`** as an expression, or **`createElement(lucky_number, props)`**, or keep a **PascalCase** first letter only if you standardize on a different pattern (this repo uses **function calls** for async children under **`Suspense`**, e.g. `{delayed_snippet({ delayMs: 750, label: "A" })}`).

## Tests

- **`routes/<area>/tests/*.test.ts`** — HTTP behavior for that feature’s paths.
- **`routes/<area>/components/foo.test.ts`** — colocated next to **`foo.tsx`** (e.g. `banana.tsx` + `banana.test.ts`).
- **`mountWeb.test.ts`** — app-level concerns (e.g. static `/assets`); avoid duplicating feature tests here.

## Tooling

- **`app/tsconfig.json`**: `jsx: "react-jsx"`, `jsxImportSource: "@kitajs/html"`, **`@kitajs/ts-html-plugin`**.
- **Vitest**: `esbuild.jsxImportSource: "@kitajs/html"` in `vitest.*.config.ts`.
- Streaming: **`@kitajs/html/suspense`** (`Suspense`, `renderToStream`).

## Static HTML

1. **`page.tsx`** — `export function home_page(props: home_page_props): JSX.Element { … }`
2. **`handler.ts`** — `await Promise.resolve(home_page(props))`, then `res.type("html").send(html)`.
3. **HTMX** — small HTML responses from **`lucky_number`**-style components; register paths on the same feature’s **`handler.ts`**.

## Streaming + Suspense

Async children: **`Promise<string>`** return type. In **`Suspense`**, pass the promise as an expression child, e.g. **`{delayed_snippet({ delayMs: 500, label: "A" })}`**.

Handler: **`renderToStream((rid) => createElement(suspense_demo_page, { rid }))`**, **`stream.pipe(res)`**.

Reference: `app/src/web/routes/demo/suspense/`.

## XSS

Use **`safe`**, **`e` / `escape`**, and **`@kitajs/ts-html-plugin`** for unsafe text.

## Related

- **`express-route-map`** — `Route`, `mapRoutes`, `web/routes/index.ts`.
- **`docs/frontend/project-structure.md`**, **`docs/frontend/overview.md`**.
