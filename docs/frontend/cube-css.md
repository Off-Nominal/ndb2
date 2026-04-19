# CUBE CSS summary (for ndb2)

**Status:** The web build emits five stylesheets under `app/src/web/public/` (served at `/assets/`): `design-tokens.css` (generated from JSON), `globals.css`, `compositions.css`, `utilities.css` (copied from `app/src/web/styles/`), and `blocks.css` (concatenated from colocated `*.css` next to components). All are linked from `app/src/web/shared/components/html_head.tsx` (**`HtmlHead`**) in cascade order. For an agent-oriented summary of the full pipeline (scripts, pnpm, nodemon, CUBE mapping), see `.cursor/skills/css-build/SKILL.md`. For **where to put CSS when authoring** pages and components (globals vs compositions vs utilities vs colocated blocks), see `.cursor/skills/cube-css-authoring/SKILL.md`.

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

| Role | Author under | Build output | `<head>` order |
|------|----------------|--------------|----------------|
| Tokens (custom properties) | `app/src/web/tokens/*.json` | `public/design-tokens.css` | 1 |
| Globals (baseline / elements) | `app/src/web/styles/globals.css` | `public/globals.css` | 2 |
| Compositions (layout) | `app/src/web/styles/compositions.css` | `public/compositions.css` | 3 |
| Utilities | `app/src/web/styles/utilities.css` | `public/utilities.css` | 4 |
| Blocks + exceptions | Colocated `*.css` under `app/src/web/` (not `public/`, `tokens/`, or `styles/`)—including **`page.css`** beside **`page.tsx`** for route-only UI | `public/blocks.css` | 5 |

**Build:** `pnpm run build:css` runs `app/scripts/build-web-css.mjs` (layer copy + block bundle). `pnpm run build` runs `build:tokens` then `build:css`. **`public/` copies are generated**—edit the `styles/` sources or colocated block files, then rebuild.

**Colocation:** Place one stylesheet next to the Kitajs component (e.g. `routes/home/components/lucky_number.css` beside `lucky_number.tsx`). Files are concatenated in **lexicographic path order**; each section is prefixed with `/* ndb2:block: relative/path.css */` in the bundle.

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

### Exception conventions

Prefer predictable attribute keys:
- **variants**: `data-variant="…"`
- **sizes**: `data-size="…"`
- **state**: `data-state="…"` (or `aria-*` for accessibility state)

HTMX interactions should also use data attributes where they help document behavior.

## Practical checklist for new UI work

When building a new view/component:
1. Can global element styles handle most of the typography and defaults?
2. Can composition classes solve layout and spacing without new block CSS?
3. Can a utility (token-driven) solve the remaining tweak?
4. Only then: add/extend a block, and keep block CSS minimal.
5. For variants/states: prefer `data-*` exceptions.

