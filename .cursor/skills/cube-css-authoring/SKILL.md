---
name: cube-css-authoring
description: >-
  Guides where to put CSS when authoring ndb2 Kitajs pages and components using CUBE CSS:
  globals vs compositions vs utilities vs colocated blocks, exceptions via data-*,
  class order in markup, and token usage. Use when adding or styling UI and deciding
  which stylesheet layer to extend. For build scripts and file outputs, use css-build.
---

# CUBE CSS — authoring pages and components

**Pair with:** **`kitajs-html-web`** (feature folders, `page.tsx`, components, HTMX) and **`css-build`** (exact paths, `build:css`, what gets concatenated). This skill is **methodology only**: how to choose a layer and organize rules.

**References:** [CUBE CSS](https://cube.fyi/), [ndb2 summary](docs/frontend/cube-css.md).

## Where CSS lives in the repo

| CUBE role | Put new rules in | File (source of truth) |
|-----------|------------------|-------------------------|
| Baseline / resets / element defaults | **Globals** | `app/src/web/styles/globals.css` |
| Layout primitives (stack, cluster, wrapper, grid) | **Composition** | `app/src/web/styles/compositions.css` |
| Single-purpose helpers (spacing tweak, token-backed one-liners) | **Utility** | `app/src/web/styles/utilities.css` |
| Component identity + structure + **exceptions** | **Block** | Colocated **`*.css`** next to the **`*.tsx`** (bundled into `blocks.css`) |

**Design tokens** are JSON → `design-tokens.css`; use **`var(--…)`** in hand-written CSS instead of raw hex/spacing literals when a token exists.

**Do not** edit `app/src/web/public/*.css` by hand except vendored assets like `htmx.min.js`; run **`pnpm run build:css`** (or **`build`**) after changing sources.

## Decision order (apply before writing block CSS)

Work through in order; stop at the first layer that can own the change:

1. **Globals** — Should this apply to **every** document by default (e.g. `body`, `a`, `html`, unqualified `table`/`p`)? If yes, add minimal rules in **`globals.css`**. **Do not** put **page-specific** or **single-route** UI here (toolbars, hero blocks, a home-only theme switcher)—those are **blocks**; use **`page.css`** next to **`page.tsx`** or a colocated **`components/*.css`** file.
2. **Composition** — Is this only **layout / rhythm** (gap, max-width, grid, vertical flow) with **no** component-specific chrome? Put it in **`compositions.css`** as a reusable class (e.g. `.flow`, `.cluster`).
3. **Utility** — Is it a **small, reusable** tweak (one property or a tight group) that might appear on many different components? Put it in **`utilities.css`** (e.g. `.text-muted` → `color: var(--color-text-muted)`).
4. **Block** — Does it define **this component’s** look or structure (card, toolbar, table row, HTMX fragment) or a **variant/state** of that component? Put it in a **colocated** stylesheet next to the component.

If unsure between composition and block: **composition** should not care *which* block is inside; **block** CSS is allowed to know the component’s markup.

## Colocated block CSS (files and naming)

- **Feature component:** `app/src/web/routes/<area>/components/my_widget.tsx` → **`my_widget.css`** in the same folder.
- **Shared component:** `app/src/web/shared/components/foo.tsx` → **`foo.css`** beside it (still picked up by the block bundle).
- **Page-only styling:** **`page.css`** next to **`page.tsx`** for markup and controls that exist **only** on that full document (e.g. `routes/home/page.tsx` + `routes/home/page.css` for the home layout chrome). If the same control is reused on multiple routes, move it to **`shared/components/`** with colocated **`.css`** there instead.

A single feature area can have **multiple** colocated CSS files (`page.css`, `components/foo.css`, …); the build concatenates **all** eligible `*.css` under `src/web/` (except `styles/`, `tokens/`, `public/`) in path order.

**Bundle order** is lexicographic by path—avoid relying on cascade between two arbitrary components; keep selectors specific enough (e.g. a root class or id on the fragment).

## Exceptions (variants and states)

Express variants and states with **attributes**, not extra bespoke classes when possible:

- **`data-variant="primary|secondary|danger"`**
- **`data-size="sm|md|lg"`**
- **`data-state="loading|disabled"`**

In **`my_widget.css`**, target them explicitly, e.g. `.my_widget[data-variant="danger"] { … }`. Prefer **`aria-*`** when the state is accessibility-relevant (`aria-busy`, `aria-disabled`).

HTMX can toggle **`data-*`** or classes via swaps; keep hooks documented in the component.

## Class order in markup (readability)

When several classes apply, order for human readers:

1. **Block** (component root class)
2. **Composition** (layout)
3. **Utility** (token helpers, spacing tweaks)

Example (illustrative): `class="prediction_card flow stack-md text-muted"` — block first, then composition, then utility.

## Tokens and theme

- Use **`var(--color-bg)`**, **`var(--space-4)`**, **`var(--text-sm)`**, etc., from generated **`design-tokens.css`**.
- Theme switching uses **`html[data-theme="dark"]`** overrides for semantic colors—components should use **alias** variables like **`--color-bg`**, not hard-coded palette steps, unless there is a good reason.

## Checklist before adding new CSS

1. Can **`globals.css`** or an existing composition/utility class cover it?
2. If it’s layout-only, is it reusable across screens? → **compositions**
3. If it’s a tiny repeated tweak → **utilities**
4. Otherwise → **colocated block** next to the **`tsx`**
5. Are exceptions expressed with **`data-*`** / **`aria-*`** where appropriate?

## Related

- **`css-build`** — scripts, `public/` outputs, nodemon, `<head>` link order.
- **`kitajs-html-web`** — route structure, **`html_head`**, HTMX, tests.
