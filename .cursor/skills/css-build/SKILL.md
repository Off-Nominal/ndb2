---
name: css-build
description: >-
  Describes ndb2 web CSS end-to-end: CUBE CSS layers mapped to repo files, design tokens
  (JSON via build-design-tokens.mjs), globals/compositions/utilities/blocks (build-web-css.mjs),
  html_head load order, /assets serving, pnpm build:tokens/build:css, and nodemon. Use when
  editing tokens, CUBE layers, colocated component CSS, static assets, or stylesheet pipeline.
---

# Web CSS build (CUBE + tokens)

## End-to-end layout

```mermaid
flowchart TB
  subgraph sources [Author sources]
    TJ[tokens/*.json]
    SG[styles/globals.css]
    SC[styles/compositions.css]
    SU[styles/utilities.css]
    BC[colocated *.css]
  end
  subgraph scripts [Build scripts]
    BT[build-design-tokens.mjs]
    BW[build-web-css.mjs]
  end
  subgraph public [app/src/web/public]
    PT[design-tokens.css]
    PG[globals.css]
    PC[compositions.css]
    PU[utilities.css]
    PB[blocks.css]
  end
  TJ --> BT --> PT
  SG --> BW --> PG
  SC --> BW --> PC
  SU --> BW --> PU
  BC --> BW --> PB
  subgraph runtime [Runtime]
    MW[mountWeb /assets]
    HH[html_head link order]
  end
  PT --> MW
  PG --> MW
  PC --> MW
  PU --> MW
  PB --> MW
  MW --> HH
```

- **Compile output:** `pnpm run build` runs **`build:tokens`** then **`build:css`** then **`build:client-js`**, then `tsc`, `vendor-htmx`, `transfer-web`. Static files under `src/web/public/` are copied to **`dist/web/public/`** for production.
- **Dev:** `nodemon` watches `src` (including **`css`** and token **`json`**). Generated files in `public/*.css` and **`public/routes/**`** (copied `*.client.js`) are **ignored** in `nodemon.json` so rebuilds do not loop.
- **Serving:** [`mountWeb`](app/src/web/mountWeb.ts) mounts **`express.static`** at **`/assets`** → `path.join(__dirname, "public")` (i.e. `dist/web/public` when running compiled output). [`html_head`](app/src/web/shared/components/html_head.tsx) uses root-absolute URLs: **`/assets/<file>.css`**.
- **API vs static:** [`mountJsonApi`](app/src/api/mountJsonApi.ts) is mounted at **`/api`** only, so JSON auth middleware never runs for **`/assets/*`** or HTML routes.

## CUBE CSS in ndb2

**CUBE** = **C**omposition, **U**tility, **B**lock, **E**xception ([cube.fyi](https://cube.fyi/), [piccalil.li writeup](https://piccalil.li/blog/cube-css/)). In this repo, layers map to files like this:

| CUBE idea | ndb2 delivery | Author |
|-----------|----------------|--------|
| **CSS baseline** + token variables | `design-tokens.css` + `globals.css` | Tokens: `app/src/web/tokens/*.json`; globals: `app/src/web/styles/globals.css` |
| **Composition** | `compositions.css` | `app/src/web/styles/compositions.css` |
| **Utility** | `utilities.css` | `app/src/web/styles/utilities.css` |
| **Block** + **Exception** | `blocks.css` | Colocated `*.css` next to components (variants/states via `data-*` in selectors) |

**Markup convention:** group classes in order: **block** → **composition** → **utility** so intent stays readable.

**Checklist for new UI:** Prefer globals → compositions → utilities; add colocated block CSS only when necessary; use **`data-variant`**, **`data-size`**, **`data-state`** (or `aria-*`) for exceptions.

Full methodology and roadmap: [`docs/frontend/cube-css.md`](docs/frontend/cube-css.md). Token values: [`docs/frontend/design.md`](docs/frontend/design.md).

## `<head>` stylesheet order

In [`html_head.tsx`](app/src/web/shared/components/html_head.tsx) (after meta/title):

1. `design-tokens.css` — custom properties
2. `globals.css` — resets / element defaults (use `var(--…)`)
3. `compositions.css` — layout primitives
4. `utilities.css` — token-backed helpers
5. `blocks.css` — concatenated block + exception rules

Then HTMX (`htmx.min.js`).

## Design tokens (`build-design-tokens.mjs`)

| Piece | Location |
|-------|----------|
| Token sources | `app/src/web/tokens/*.json` (arrays; schema under `tokens/schema/`) |
| Generator | `app/scripts/build-design-tokens.mjs` |
| Output | `app/src/web/public/design-tokens.css` (do not edit by hand) |

**pnpm:** `build:tokens` — also chained from `build` / `postinstall`.

**Token item:** `name` (string), `value` (string), optional `description`. If `value` equals another token’s `name`, CSS emits **`var(--dotted-name-as-kebab)`**.

**Name → variable:** `brand.500` → `--brand-500`; `text.2xl` → `--text-2xl`.

**`colors.json`:** Palette (`brand.*`, `neutral.*`, …); `color.semantic.*` → `--color-<kebab>`; `color.light.*` / `color.dark.*` → shared `--color-*` in `:root` vs `html[data-theme="dark"]` (pairs must match). **`data-theme`:** `light` | `dark` | `system`. Cookie **`ndb2_theme`** (non-HttpOnly) stores `light`/`dark`; absent = **`system`** → dark when `prefers-color-scheme: dark` (generated `@media` on `html[data-theme="system"]`). Route colocated **`page.client.js`** (see **`build-client-js`**) + `themePreferenceMiddleware` (rolling **`Set-Cookie`** refresh for `light`/`dark`): see `app/src/web/middleware/themePreferenceMiddleware.ts` and `routes/home/page.client.js`.

**`TOKEN_FILES` order** in the script controls declaration order inside `:root`. **`meta.json`** is not part of token CSS unless added to `TOKEN_FILES`.

**Extend literals:** update **`isValidTokenValue`** in `build-design-tokens.mjs` if new CSS value shapes are needed.

## CUBE layers + blocks (`build-web-css.mjs`)

| Piece | Location |
|-------|----------|
| Layer sources | `app/src/web/styles/globals.css`, `compositions.css`, `utilities.css` |
| Block sources | Any `*.css` under `app/src/web/` **except** `public/`, `tokens/`, `styles/` |
| Generator | `app/scripts/build-web-css.mjs` |
| Outputs | Copies of the three layer files + **`blocks.css`** (concatenated, `/* ndb2:block: path */` banners) |

**pnpm:** `build:css` — also chained from `build` / `postinstall`.

**Block bundle order:** Lexicographic sort of file paths. Add block CSS beside `*.tsx`; run `build:css` or `build`; do not hand-edit `public/blocks.css`.

## Route colocated client JS

See **`web-client-js`** for colocation, `build-client-js.mjs`, generated **`routeClientScripts.ts`**, **`/assets/routes/...`**, and **`html_head`** wiring.

## Changing the pipeline

- **New token file:** add JSON under `tokens/`, append filename to **`TOKEN_FILES`** in `build-design-tokens.mjs`, rebuild.
- **New palette prefix:** extend color primitive detection in `build-design-tokens.mjs` (or refactor to a prefix list).
- **New theme key:** add matching `color.light.<X>` and `color.dark.<X>` in `colors.json`.
- **Dark selector:** change `html[data-theme="dark"]` in `build-design-tokens.mjs`; update tests if needed.
- **New layer file:** uncommon; would require editing `build-web-css.mjs` and `html_head.tsx`.
- **New route client script:** add `*.client.js` under `routes/<area>/`, run **`build:client-js`**; `page.tsx` already uses **`clientScriptsForModule(__filename)`** so no key edit is needed.
- **Asset URL base:** if the app is ever served under a subpath, root-absolute `/assets/...` links may need a configurable prefix (not implemented today).

## Related

- **cube-css-authoring** — where to put new CSS (globals vs compositions vs utilities vs blocks) when building pages/components.
- **kitajs-html-web** — `page.tsx`, `handler.ts`, [`html_head`](app/src/web/shared/components/html_head.tsx), HTMX.
- **web-client-js** — route colocated `*.client.js`, `build:client-js`, static script URLs.
- **express-route-map** — web `Route` modules.

This skill supersedes the old **`design-tokens-build`** skill (removed); scope now covers the full CSS pipeline, not only tokens.
