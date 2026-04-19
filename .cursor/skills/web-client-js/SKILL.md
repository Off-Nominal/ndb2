---
name: web-client-js
description: >-
  ndb2 route-colocated client scripts: `*.client.js` under app/src/web/routes,
  build-client-js.mjs copy + generated routeClientScripts.ts, URLs under
  /assets/routes/, HtmlHead wiring via clientScriptsForModule. Use when adding
  or changing deferred browser scripts for the Kitajs HTML app, the static
  asset pipeline, or public/routes output.
---

# Web route colocated client JS (ndb2)

## Colocation

- Put small **browser** scripts beside the feature that owns them: **`*.client.js`** anywhere under **`app/src/web/routes/`** (e.g. `routes/home/page.client.js`).
- Naming: the **`*.client.js`** suffix is the only discovery rule; the build does not parse TS/JS imports or `page.tsx`.
- Scripts are plain JS (no bundler). Keep them minimal (progressive enhancement, theme cookie, tiny HTMX helpers, etc.).

## Build (`build-client-js.mjs`)

| Step | Behavior |
|------|----------|
| **Discover** | Recursively find all **`*.client.js`** under **`src/web/routes/`**, sort by path. |
| **Clean** | Delete **`src/web/public/routes/`** so removed sources do not leave stale copies. |
| **Copy** | Each file → **`src/web/public/routes/<same-relative-path-as-under-routes/>`**. |
| **Generate** | Write **`src/web/generated/routeClientScripts.ts`** — a map from **route folder key** → **script URL list**. |

**Route folder key:** POSIX `dirname` of the path relative to `routes/`. Example: `home/page.client.js` → key **`"home"`**; `demo/suspense/page.client.js` → **`"demo/suspense"`**. Multiple `*.client.js` in the same folder are all listed for that key (order follows discovery sort).

## URLs and static serving

- [`mountWeb`](app/src/web/mountWeb.ts) serves **`express.static`** at **`/assets`** from **`public/`**.
- A copied file **`public/routes/home/page.client.js`** is therefore **`/assets/routes/home/page.client.js`** (not `public/assets/...`).

## Wiring pages

1. Run **`pnpm run build:client-js`** (or full **`pnpm run build`** / **`postinstall`** — it runs after **`build:css`**).
2. In **`page.tsx`**, pass into [`HtmlHead`](app/src/web/shared/components/html_head.tsx):

   **`clientScripts: clientScriptsForModule(__filename)`**

   from [`shared/clientScriptsForModule.ts`](app/src/web/shared/clientScriptsForModule.ts). That derives the route key from the directory containing the page module (works with the CJS compile output used today).

3. Optional: **`clientScriptsForRouteDir("home")`** from the generated file if you want an explicit key.

`HtmlHead` emits **`<script src="…" defer />`** for each URL **before** **`/assets/htmx.min.js`**.

## pnpm / dev

- **`package.json`:** script **`build:client-js`** → `node ./scripts/build-client-js.mjs`; chained from **`build`** and **`postinstall`** after **`build:css`**.
- **`nodemon.json`:** ignore **`src/web/public/routes`** and **`src/web/generated/**`** so copies and the manifest do not restart the dev loop (see **`css-build`**).

## Tests and CI

- Commit or regenerate **`routeClientScripts.ts`** and **`public/routes/**`** as your team prefers for CI (same idea as generated CSS): **`mountWeb`** tests expect copied files to exist for served URLs.

## Related

- **`kitajs-html-web`** — `page.tsx`, `handler.tsx`, `HtmlHead`.
- **`css-build`** — stylesheet pipeline and **`HtmlHead`** load order for CSS vs JS.
- **`express-route-map`** — web router mount; static **`/assets`** is not behind JSON API auth.
