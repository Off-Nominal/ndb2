---
name: design-tokens-build
description: >-
  Describes the ndb2 web CSS build: design tokens (build-design-tokens.mjs, tokens JSON,
  design-tokens.css), CUBE layers + colocated blocks (build-web-css.mjs, styles/, blocks.css),
  html_head link order, nodemon ignores, and pnpm build:css / build:tokens. Use when editing
  tokens, globals/compositions/utilities, colocated component CSS, or static asset wiring.
---

# Design tokens build (JSON → CSS)

## What runs where

| Piece | Location |
|-------|----------|
| Token sources | `app/src/web/tokens/*.json` (arrays of objects; see schema under `tokens/schema/`) |
| Generator | `app/scripts/build-design-tokens.mjs` (Node ESM, no extra deps) |
| Generated CSS | `app/src/web/public/design-tokens.css` (**do not edit by hand**) |
| Loaded in HTML | `app/src/web/shared/components/html_head.tsx` → `<link href="/assets/design-tokens.css" />` |
| Static mount | `mountWeb` serves `./public` at `/assets` |

**pnpm:** `build:tokens` and `build:css` are separate scripts. `build` runs **`build:tokens` then `build:css`**, then `tsc` and the rest; `postinstall` runs `vendor-htmx`, `build:tokens`, and `build:css`.

**nodemon:** Watches `src` with extensions including **`css`**. Generated assets under `src/web/public/` (**`design-tokens.css`**, **`globals.css`**, **`compositions.css`**, **`utilities.css`**, **`blocks.css`**) are **ignored** so the CSS build writing `public/` does not restart in a loop.

## CUBE layers + block bundle (`build-web-css.mjs`)

| Piece | Location |
|-------|----------|
| Layer sources (edit these) | `app/src/web/styles/globals.css`, `compositions.css`, `utilities.css` |
| Block sources (colocated) | Any `*.css` under `app/src/web/` **except** `public/`, `tokens/`, `styles/` |
| Generator | `app/scripts/build-web-css.mjs` |
| Outputs | `app/src/web/public/globals.css`, `compositions.css`, `utilities.css` (copies), `blocks.css` (concatenated, with `/* ndb2:block: … */` banners) |

**Load order** in [`html_head.tsx`](app/src/web/shared/components/html_head.tsx): `design-tokens.css` → `globals.css` → `compositions.css` → `utilities.css` → `blocks.css`.

**Block order:** Colocated files are sorted by **full path string** (stable cascade). To change order, adjust paths or extend the script with an explicit manifest later.

**How to add block CSS:** Create `my_component.css` beside `my_component.tsx`. Run `pnpm run build:css` (or `pnpm run build`). Do not edit `public/blocks.css` by hand.

## Input shape

Each token file is a **JSON array**. Each element:

- **`name`** (string, required): unique id, often dotted (`brand.500`, `space.4`, `color.light.bg`).
- **`value`** (string, required): either a **literal CSS fragment** (hex, `0.25rem`, `1.5`, `400`, …) or the **`name` of another token** (indirection).
- **`description`** (string, optional): emitted as a `/* … */` line above that property when present.

**Excluded from CSS:** `meta.json` is not listed in the script’s `TOKEN_FILES`; use it for package metadata only unless the script is updated.

**`TOKEN_FILES` order** in the script controls **declaration order inside `:root`**: color primitives first (from `colors.json`), then the other files’ tokens (space, radius, typography scales), then semantic and light-theme aliases. Changing array order in the script changes output ordering (usually only matters for readability or cascade edge cases).

## How names become CSS variables

- General rule: token `name` → custom property **`--` + dots replaced with hyphens**  
  Examples: `brand.500` → `--brand-500`; `text.2xl` → `--text-2xl`.

## Reference resolution

1. While loading, the script collects the set of all **`name`** values across `TOKEN_FILES`.
2. For each token’s **`value`**: if `value` equals some **`name`**, the CSS value is **`var(--<that-name-with-hyphens>)`**.
3. Otherwise `value` is emitted **as-is**, after validation.

If `value` is neither a known token name nor a **recognized literal** (hex, plain number, common `length`/`%` patterns, `0`, etc.), the script **exits with an error**. To support new literal shapes (e.g. `calc()`, `oklch()`, keywords like `inherit`), extend **`isValidTokenValue`** in `build-design-tokens.mjs`.

## Special handling in `colors.json`

Entries are split by **name prefix** (and must live in `colors.json`):

| Prefix | Role | CSS output |
|--------|------|------------|
| `brand.*`, `neutral.*`, `success.*`, `warning.*`, `danger.*`, `info.*` | Palette primitives | `--brand-500: #…;` (or `var(--…)` if `value` references another token) |
| `color.semantic.*` | Semantic UI colors | **`--color-<suffix>`** with suffix in **kebab-case** (e.g. `color.semantic.success` → `--color-success`) |
| `color.light.*` | Light theme surface/text/primary aliases | Same **`--color-<kebab-suffix>`** as dark (e.g. `color.light.bg` → `--color-bg`), emitted under **`:root`** after primitives and scales |
| `color.dark.*` | Dark theme overrides | Same **`--color-*`** names as light, emitted under **`html[data-theme="dark"]`** |

The script **requires** every `color.light.<X>` to have a matching `color.dark.<X>` and vice versa (same `<X>` after the prefix).

**Theme usage:** Default is light (`:root`). Opt into dark by setting **`data-theme="dark"`** on `<html>`.

## How to change the pipeline

### Add a new token file

1. Add `your-file.json` under `app/src/web/tokens/` as an array of `{ name, value, description? }`.
2. Append **`"your-file.json"`** to **`TOKEN_FILES`** in `build-design-tokens.mjs` (position = order inside `:root` after color primitives, unless you place it next to related scales).
3. Run **`pnpm run build:tokens`** (or **`pnpm run build`**) and commit `design-tokens.css` if the repo keeps generated CSS tracked.
4. If literals need new validation patterns, update **`isValidTokenValue`**.

### Add palette or semantic colors

- **New scale** (e.g. `accent.*`): extend the **`else if` chain** for color primitives in the script, or refactor to a list of allowed prefixes so you do not have to touch the logic for every new scale.
- **New theme key** (e.g. `color.light.focusRing`): add the same suffix under both **`color.light.*`** and **`color.dark.*`**; the script maps camelCase segments to kebab-case in the CSS name (`focusRing` → `--color-focus-ring`).

### Change dark-mode selector

Replace the **`html[data-theme="dark"]`** block opener/closer strings in the script (and update tests in `mountWeb.test.ts` if they assert the selector).

### Point pages at a different URL

Update **`html_head.tsx`** and any tests that fetch `/assets/design-tokens.css`.

### Avoid nodemon restart loops

Keep generated **`design-tokens.css`** in **`nodemon.json`** `ignore` if the file stays under `src/web/public/`.

## Related docs

- Token values and intent: `docs/frontend/design.md`
- CUBE CSS / utilities direction: `docs/frontend/cube-css.md`
- Page wiring: **kitajs-html-web** skill (`shared/components`, `html_head`)
