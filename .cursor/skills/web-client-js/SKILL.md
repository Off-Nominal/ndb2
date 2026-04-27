---
name: web-client-js
description: >-
  ndb2 browser client scripts: `*.client.ts` (preferred) or `*.client.js` under
  app/src/web/routes or shared/components, Vite via build-client-js.mjs, generated
  routeClientScripts.ts, /assets/routes. Use when adding or changing deferred
  browser scripts or the static asset pipeline.
---
# Web colocated client JS (ndb2)

## Colocation

- **Routes:** **`*.client.ts`** or **`*.client.js`** under **`app/src/web/routes/`** (e.g. `home/page.client.ts`).
- **Shared components:** under **`app/src/web/shared/components/`**; output **`dist/web/public/routes/shared/components/.../file.client.js`**. Map key: POSIX **`dirname`**. The build lists them all in **`sharedComponentsClientScriptUrls`**; **`HtmlHead`** loads those by default, then any route **`clientScripts`**. Handlers only pass **`clientScripts`** for **route** colocated `*.client.*` (e.g. `clientScriptsForModule(__filename)`).
- **Authoring in TypeScript:** use **`*.client.ts`**. The server **`tsc`** build **excludes** `**/*.client.ts` (see `tsconfig.json`); compile for the browser is **`vite build`** (one Rollup IIFE per entry) in **`build-client-js.mjs`**, with **`@web/*`** resolved like **`tsconfig.client.json`**. For DOM types and a clean check, use **`app/tsconfig.client.json`** and **`pnpm run typecheck:client`**. Each `*.client.ts` entry should be a **module** (e.g. `export {}` at the end) so globals in two files do not merge.
- Plain **`*.client.js`** is still **copied** as-is (no bundler) if you add one.
- Keep scripts small (progressive enhancement, cookies, tiny HTMX helpers).

## Build (`build-client-js.mjs`)

| Step | Behavior |
|------|----------|
| **Discover** | All **`*.client.ts`** and **`*.client.js`** under the two roots, sorted. |
| **Clean** | Delete **`dist/web/public/routes/`**. |
| **Emit** | **`*.client.ts`**: **Vite** (per-entry **`iife`**, `es2020`, no minify by default) → **`dist/web/public/routes/.../same-name.client.js`**. **`*.client.js`**: copy. |
| **Generate** | **`src/web/generated/routeClientScripts.ts`**: per-folder map, **`clientScriptsForRouteDir`**, and **`sharedComponentsClientScriptUrls`** (all shared-component scripts, for **`HtmlHead`**). |

**Keys:** `dirname` of the path under `public/routes` (e.g. `home`, `shared/components/theme-selector`).

## URLs and static serving

- **`mountWeb`** serves **`/assets`** from **`dist/web/public/`** (see **`mountWeb`**) → **`/assets/routes/.../file.client.js`**.

## Wiring pages

1. Run **`pnpm run build:client-js`** (or **`build`** / **`postinstall`** after **`build:css`**).
2. **Route only:** **`clientScripts: clientScriptsForModule(__filename)`** when the page needs a route `*.client.js` (shared `shared/components` scripts are **not** passed here; **`HtmlHead`** adds them automatically).
3. **`HtmlHead`**: **`<script src="…" defer />`**.

## pnpm / dev

- **`typecheck:client`**: `tsc -p tsconfig.client.json` for **`*.client.ts`** only.
- **`dev-watch-assets`**: watch **`**/*.client.ts`** and **`**/*.client.js`** under routes and shared components.
- **HMR (`NODE_ENV=dev`):** Express mounts **Vite middleware** (`createApp`) before **`/assets`** static. **`HtmlHead`** injects **`/@vite/client`** and serves colocated **`*.client.ts`** as **`type="module"`** from **`/src/web/...`** (see **`vite-dev-client-src.ts`**). Helmet **CSP is off** in dev so Vite’s client can run. Production still uses built **`/assets/routes/*.client.js`** and strict CSP.
- **CUBE CSS:** Styles ship as one entry (**`cube-entry.css`** in dev via Vite middleware, **`/assets/cube.css`** in prod). **`dev-watch-assets`** regenerates **`cube-blocks.css`** on source changes; Vite provides **CSS HMR** without a separate full-reload plugin.

## Tests and CI

- Regenerate/check in **`routeClientScripts.ts`**; client bundles are emitted to **`dist/web/public/routes/**`**, not under **`src/web/public`**.

## Related

- **`kitajs-html-web`**, **`css-build`**, **`express-route-map`**.
