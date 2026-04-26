---
name: kitajs-html-web
description: >-
  NDB2 web rendering with @kitajs/html: PascalCase Kitajs components, kebab-case
  component files in one folder per component (name/name.tsx, name.css, name.test.tsx, index.ts), feature
  folders (page.tsx, handler.tsx, tests/), HTMX,
  shared/utils (mergeClass, merge_class.ts), Suspense + renderToStream. Use when adding
  or changing server-rendered UI under app/src/web; not for React client apps or EJS.
---

# Kitajs HTML (web) — ndb2 patterns

**Decision:** Server-rendered HTML for `app/src/web` uses **[Kitajs Html](https://github.com/kitajs/html)** (JSX/TSX compiled to HTML strings). Do **not** add Express view engines, EJS, or similar.

**Layout:** Features live under **`app/src/web/routes/<area>/`**. Each area typically has:

- **`page.tsx`** — main document or screen; export **`HomePage`**, **`SuspenseDemoPage`**, etc. (**PascalCase**). Props types **`HomePageProps`**, … Optional **`page.css`** beside **`page.tsx`** for block styles scoped to that route (see **`cube-css-authoring`**). Optional **`page.client.js`** (or other **`*.client.js`**) for small deferred scripts — colocation, build, and **`HtmlHead`** wiring: **`web-client-js`** (uses **`clientScriptsForModule(__filename)`** from **`shared/clientScriptsForModule.ts`**).
- **`handler.tsx`** — Express **`Route`**; export name stays **PascalCase** (`Home`, `SuspenseDemo`). Use **JSX** for page/components (`<HomePage … />`, `<LoginPage … />`) so this file is TSX.
- **`tests/`** — **route/page-level** tests (e.g. supertest on `mountWeb` for that feature’s paths).
- **`components/<name>/`** — area-local Kitajs modules: **`lucky-number/lucky-number.tsx`**, colocated **`.css`**, optional **`lucky-number.test.tsx`**, and **`index.ts`** re-exporting the public API so importers can use **`import { LuckyNumber } from "./components/lucky-number"`** (PascalCase export **`LuckyNumber`**).

Cross-cutting UI → **`app/src/web/shared/components/<name>/`** (same **folder-per-component** pattern: **`button/button.tsx`**, **`page-layout/page-layout.css`**, **`index.ts`**). Small **TypeScript** helpers (no JSX) that support markup/Kita components live in **`app/src/web/shared/utils/`** — e.g. **`mergeClass`** in **`merge_class.ts`** to concatenate a block’s **`[ bracket ]`** **`class`** with optional extra groups from props (used by **`Button`**; see also **`cube-css-authoring`**).

**`PageLayout`** / **`AuthenticatedPageLayout`** (`page-layout/page-layout.tsx` via `page-layout/index.ts`) — shared **`<head>`** and **`[ glass-background ]`** on **`body`**. **`PageLayout`** is **main column only** (login, 404, OAuth error pages, etc. — no site nav). **`AuthenticatedPageLayout`** takes **`auth`** ( **`WebAuthAuthenticated`** ) and adds the right-hand **site nav** (drawer on small viewports, collapsible column on tablet, fixed column on wide — no JS) + **`main#main`** with **`.center`**. Default **`NavigationMenu`** uses **`auth`** for the sign-out form (POST `/auth/logout` + CSRF, same as the home page). Optional **`navigation`** overrides that default. Colocated block styles: **`page-layout/page-layout.css`** (includes **`.page-layout`** layout tokens for **`.center`**).

Official concepts: [Async components and Suspense](https://html.kitajs.org/guide/introduction#async-components-and-suspense) (v5 docs; API matches `@kitajs/html` **v4.x** via `@kitajs/html/suspense`).

## Naming (PascalCase components, kebab-case component files)

- **Component** `.tsx` / colocated **`.css`** / **`.test.ts`** or **`.test.tsx`**: **kebab-case** file names **inside a folder** named for the component (`page-layout/page-layout.tsx`, `lucky-number/lucky-number.tsx`, `html-head/html-head.tsx`). **Barrel** **`index.ts`** re-exports the public API. Top-level **route** files such as **`page.tsx`** and **`handler.tsx`** stay as named by convention, not kebab renames.
- **Exports:** **`PageLayout`**, **`HtmlHead`**, **`LuckyNumber`**; props types **`PageLayoutProps`**, **`HtmlHeadProps`**, …
- **JSX:** Use **`<PageLayout>`**, **`<HtmlHead />`**, etc. The TS JSX transform treats **lowercase** tags as intrinsic HTML, so a kebab file name is **not** a valid component tag (use **PascalCase** imports/exports for components).
- **Function-call form** is still valid: **`PageLayout({ children: … })`**, **`HtmlHead({ title: "…" })`**, or **`createElement(SuspenseDemoPage, props)`** in handlers.
- **Async children under `Suspense`** often use a **call** so the promise is explicit: **`{DelayedSnippet({ delayMs: 750, label: "A" })}`**.

## Tests

- **`routes/<area>/tests/*.test.ts`** — HTTP behavior for that feature’s paths.
- **`routes/<area>/components/foo/foo.test.ts(x)`** — colocated in **`foo/`** next to **`foo.tsx`**.
- **`mountWeb.test.ts`** — app-level concerns (e.g. static `/assets`); avoid duplicating feature tests here.

## HTMX attribute types

- **`app/src/web/htmx_kitajs.d.ts`** augments **`JSX.HtmlTag`** with the [htmx core attribute list](https://htmx.org/reference/#attributes) so you can write **`hx-get`**, **`hx-target`**, etc. directly on elements. Open-ended **`hx-on`** variants may still use **`attrs`** (see file comment).

## Tooling

- **`app/tsconfig.json`**: `jsx: "react-jsx"`, `jsxImportSource: "@kitajs/html"`, **`@kitajs/ts-html-plugin`**.
- **Vitest**: `esbuild.jsxImportSource: "@kitajs/html"` in `vitest.*.config.ts`.
- Streaming: **`@kitajs/html/suspense`** (`Suspense`, `renderToStream`).

## Static HTML

1. **`page.tsx`** — `export function HomePage(props: HomePageProps): JSX.Element { … }`
2. **`handler.tsx`** — `await Promise.resolve(<HomePage … />)`, then `res.type("html").send(html)` (or `renderToStream` for streaming pages).
3. **HTMX** — small HTML responses from **`LuckyNumber`**-style components; register paths on the same feature’s **`handler.tsx`**.

## Streaming + Suspense

Async children: **`Promise<string>`** return type. In **`Suspense`**, pass the promise as an expression child, e.g. **`{DelayedSnippet({ delayMs: 500, label: "A" })}`**.

Handler: **`renderToStream((rid) => <SuspenseDemoPage rid={rid} theme={theme} />)`**, **`stream.pipe(res)`**.

Reference: `app/src/web/routes/demo/suspense/`.

## XSS

Use **`safe`**, **`e` / `escape`**, and **`@kitajs/ts-html-plugin`** for unsafe text.

## Related

- **`app/src/web/shared/utils/merge_class.ts`** — **`mergeClass`**, for composing `class` strings; **`cube-css-authoring`** for when to use it.
- **`middleware-patterns`** / **`middleware-naming`** — request-scoped values and file naming (see `theme-preference.ts`, `middleware/auth/session.ts` for web sessions).
- **`express-route-map`** — `Route`, `mapRoutes`, `web/routes/index.ts`.
- **`ndb2-web-design`** — visual tone, colour schemes, light/dark (optional when styling pages).
- **`css-build`** — CUBE layers, design tokens, `HtmlHead` stylesheet order, `/assets` static CSS.
- **`web-client-js`** — colocated `*.client.js`, `build:client-js`, `/assets/routes/...` scripts in `HtmlHead`.
- **`cube-css-authoring`** — how to organize new CSS (which layer, colocation, `data-*` exceptions) when editing components or pages.
- **`docs/frontend/project-structure.md`**, **`docs/frontend/overview.md`**.
