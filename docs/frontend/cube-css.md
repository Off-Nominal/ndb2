# CUBE CSS summary (for ndb2)

**Status:** The web build emits one bundled stylesheet **`cube.css`** under `app/dist/web/public/` (served at `/assets/cube.css` in production). Sources: token JSON → `src/web/generated/design-tokens.css`; layers from `app/src/web/styles/`; colocated blocks via `src/web/generated/cube-blocks.css` (`@import` list from `generate-cube-blocks-manifest.mjs`); Vite bundles `styles/cube-entry.css` (`build-cube-css.mjs`). **`HtmlHead`** uses **`cubeStylesheetHref()`**: in dev, `/src/web/styles/cube-entry.css` (Vite CSS HMR). For the full pipeline, see `.cursor/skills/css-build/SKILL.md`. For **authoring** (globals vs compositions vs utilities vs blocks), see `.cursor/skills/cube-css-authoring/SKILL.md`. For **viewport tiers**, see `.cursor/skills/web-breakpoints/SKILL.md`.

This document summarizes the CUBE CSS methodology (Andy Bell) and captures how we intend to apply it in the ndb2 frontend.

References:
- CUBE CSS site: `https://cube.fyi/`
- Blog post: `https://piccalil.li/blog/cube-css/`

## What “CUBE” stands for

**CUBE** = **C**omposition, **U**tility, **B**lock, **E**xception.

It’s a CSS methodology oriented towards **simplicity, pragmatism, and consistency**, and it intentionally **works with the cascade** rather than trying to eliminate it.

## The layers

### CSS (the baseline)

Before components, we establish a strong baseline via:
- sensible element defaults (typography, links, form elements)
- global tokens (custom properties) for color/space/type/motion
- consistent rhythm/spacing rules so most UI “just works” with minimal per-component CSS

In CUBE, this global layer does a lot of the heavy lifting, so “component CSS” stays small.

### Composition

**Composition classes** define layout and flow—the “skeleton” of a page/section/component.

Common composition goals:
- wrappers/containers with max-width and padding
- stacks/flows that handle vertical rhythm
- clusters/rows for inline groups
- grids for responsive multi-column layouts

Composition should be:
- reusable across many views
- mostly content-agnostic (it shouldn’t care *what* components are inside)

### Utility

**Utilities** are single-purpose (or tightly-scoped) classes that do one job well.

Typical utility roles in CUBE:
- applying spacing rules (`gap`, `margin`, `padding`)
- applying “tokens” (foreground/background colors, font sizes)
- small behavioral tweaks (e.g., visually-hidden, sr-only)

Utilities are most powerful when backed by **design tokens**, so we don’t hardcode values repeatedly.

### Block

**Blocks** are “components” (card, button, table, nav, etc.).

In CUBE, blocks are intentionally lighter than in component-centric systems because:
- the global CSS layer handles defaults
- compositions handle layout/rhythm
- utilities handle many one-off adjustments

Block CSS should focus on:
- the component’s identity
- structural styling that can’t be achieved by composition + utilities

### Exception

**Exceptions** are variants/states of a block, expressed with attributes (commonly `data-*`).

Examples:
- `data-variant="primary|secondary|danger"`
- `data-size="sm|md|lg"`
- `data-state="loading|disabled|reversed"`

This creates a consistent hook for both CSS and any JS/HTMX-driven behaviors.

## Class grouping convention (readability)

CUBE often groups classes in markup to make intent obvious.

Example grouping order:
1. **Block** class(es)
2. **Composition** class(es)
3. **Utility** class(es) / token classes

Some teams add visual separators like brackets to clarify grouping. Whether we use brackets or a delimiter is optional; the core requirement is **consistent grouping** so markup communicates intent.

## How we’ll apply CUBE CSS in ndb2

### Goals

- **Ship less CSS** by leaning on the cascade + reusable compositions/utilities.
- **Keep markup readable** by grouping block/composition/utility concerns.
- **Prefer tokens over literals** so the design system is consistent and easy to evolve.

### Token strategy (recommended)

We will **author design tokens in JSON** (colors, typography, spacing, radii, etc.) and run a **build-time script** that generates:
- a CSS file containing **CSS custom properties** (the canonical runtime representation)
- a CSS file containing **token utility classes** (small, single-purpose classes that apply those tokens)

At runtime, the app uses **CSS custom properties** for core tokens, such as:
- colors: `--color-bg`, `--color-surface`, `--color-text`, `--color-accent`, …
- spacing scale: `--space-1 … --space-n`
- type scale: `--font-size-*`, `--line-height-*`
- radii/shadows: `--radius-*`, `--shadow-*`

Then implement utilities that apply those tokens (or apply them directly in block CSS when appropriate).

### Stylesheet pipeline (implemented)

| Role | Author under | In bundle | Cascade order inside `cube.css` |
|------|----------------|-----------|--------------------------------|
| Tokens (custom properties) | `app/src/web/tokens/*.json` | Via `generated/design-tokens.css` | 1 |
| Globals (baseline / elements) | `app/src/web/styles/globals.css` | Imported by `cube-entry.css` | 2 |
| Compositions (layout) | `app/src/web/styles/compositions.css` | Imported by `cube-entry.css` | 3 |
| Utilities | `app/src/web/styles/utilities.css` | Imported by `cube-entry.css` | 4 |
| Blocks + exceptions | Colocated `*.css` (not `public/`, `tokens/`, `styles/`, `generated/`) | Via `generated/cube-blocks.css` | 5 |

**Build:** `pnpm run build:tokens` writes `src/web/generated/design-tokens.css`. `pnpm run build:css` runs `generate-cube-blocks-manifest.mjs` and `build-cube-css.mjs` (Vite) → `dist/web/public/cube.css`.

**Colocation:** Same as before; block files are listed in **lexicographic path order** in `cube-blocks.css`, each with `/* ndb2:block: relative/path */` before its `@import`; Vite inlines them into `cube.css`.

### Theme (light / dark / system)

- **`ndb2_theme` cookie:** **Not** `HttpOnly` so the client can persist the choice without a round trip. `Path=/`, `SameSite=Lax`. Values **`light`** or **`dark`**. **Absent** or cleared = **system**, matching OS **`prefers-color-scheme`**.
- **`<html data-theme>`:** `light`, `dark`, or `system`. Server reads the cookie via `themePreferenceMiddleware` and sets the attribute on first paint; colocated **`routes/home/page.client.js`** updates `data-theme` and the cookie on `#theme-select` **change** (copied to `/assets/routes/...` by **`pnpm run build:client-js`**, included via `clientScriptsForModule(__filename)` in `HtmlHead`).
- **CSS:** `:root` holds light semantic aliases; `html[data-theme="dark"]` overrides for forced dark; `@media (prefers-color-scheme: dark) { html[data-theme="system"] { … } }` applies dark tokens when the cookie is not set and the OS prefers dark.
- **Rolling expiry:** Middleware re-sends **`Set-Cookie`** on each web request when the user has **`light`** or **`dark`**, so **`Max-Age`** resets while they use the site (only long absence hits the timeout). Cookie shape lives in **`THEME_COOKIE_CONFIG`** in `theme-preference.ts` — duplicate in **`routes/home/page.client.js`** must stay identical.

### Composition utilities we’ll likely want early

These are typical “composition primitives” to standardize layout:
- `wrapper` / `container`: max-width + horizontal padding
- `flow`: vertical rhythm for “stacked” content
- `cluster`: horizontal grouping with wrap + gap (toolbars, pills, actions)
- `grid`: responsive grids (cards, dashboards)
- `sidebar` (optional): two-column layout with a flexible main area

### Block conventions

Blocks should:
- be named after the UI concept (`card`, `table`, `tabs`, `nav`, `button`)
- avoid encoding layout concerns that belong to composition (e.g. page-level spacing)
- expose variants via `data-*` exceptions where needed

**Do not** use BEM-style **`block__element`** or **`block__element--modifier`** class names for routine inner structure and layout (for example **`app-shell__grid`**, **`app-shell__main`**, **`app-shell__main--solo`**). In ndb2 CUBE, that duplicates parallel “families” instead of the intended flow: **one block** root per colocated component (e.g. `.page-layout`), **child rules nested with `&`** in the block stylesheet, **composition** classes from `compositions.css` for shared layout primitives, and **`data-*`** for variants. **`app-shell__*`** in `page-layout` is legacy. Full authoring rules, bracket grouping, and when `__` might still be acceptable: `.cursor/skills/cube-css-authoring/SKILL.md` (*Nesting child and element rules under the block root*).

### Exception conventions

Prefer predictable attribute keys:
- **variants**: `data-variant="…"`
- **sizes**: `data-size="…"`
- **state**: `data-state="…"` (or `aria-*` for accessibility state)

HTMX interactions should also use data attributes where they help document behavior.

## Responsive breakpoints

ndb2 uses **narrow (base)** through **tablet**, **desktop**, and **wide** with shared `rem` boundaries. Within handsets there is also **`breakpoint.mobile`** at **`36rem`** (~576px) before tablet at **`48rem`**. Desktop and wide start at **`64rem`** and **`80rem`** (16px root). Use the same literals in `@media` and comments so layout stays consistent across blocks and routes. Full table, patterns, and shell/nav notes: `.cursor/skills/web-breakpoints/SKILL.md`.

## Practical checklist for new UI work

When building a new view/component:
1. Can global element styles handle most of the typography and defaults?
2. Can composition classes solve layout and spacing without new block CSS?
3. Can a utility (token-driven) solve the remaining tweak?
4. Only then: add/extend a block, and keep block CSS minimal.
5. For variants/states: prefer `data-*` exceptions.

