---
name: cube-css-authoring
description: >-
  Guides where to put CSS when authoring ndb2 Kitajs pages and components using CUBE CSS:
  globals vs compositions vs utilities vs colocated blocks, exceptions via data-*,
  markup-driven composition with a fixed class order in markup, app/src/web/shared/utils/merge_class (mergeClass) for class strings in TSX, and token usage. Use when
  adding or styling UI and deciding which stylesheet layer to extend. For build scripts and
  file outputs, use css-build.
---

# CUBE CSS — authoring pages and components

**Pair with:** **`kitajs-html-web`** (feature folders, `page.tsx`, components, HTMX) and **`css-build`** (exact paths, `build:css`, what gets concatenated). This skill is **methodology only**: how to choose a layer and organize rules.

**References:** [CUBE CSS](https://cube.fyi/), [ndb2 summary](docs/frontend/cube-css.md).

## Where CSS lives in the repo

| CUBE role | Put new rules in | File (source of truth) |
|-----------|------------------|-------------------------|
| Baseline / resets / element defaults | **Globals** | `app/src/web/styles/globals.css` |
| Layout primitives (stack, cluster, wrapper, grid); may expose **`--*` hooks** (see below) | **Composition** | `app/src/web/styles/compositions.css` |
| Single-purpose **behaviors** (often several properties); not Tailwind-style one-prop atoms | **Utility** | `app/src/web/styles/utilities.css` |
| Component identity + structure + **exceptions** | **Block** | Colocated **`*.css`** next to the **`*.tsx`** (bundled into `blocks.css`) |

**Design tokens** are JSON → `design-tokens.css`; use **`var(--…)`** in hand-written CSS instead of raw hex/spacing literals when a token exists.

**Do not** edit `app/src/web/public/*.css` by hand except vendored assets like `htmx.min.js`; run **`pnpm run build:css`** (or **`build`**) after changing sources.

## Decision order (apply before writing block CSS)

Work through in order; stop at the first layer that can own the change:

1. **Globals** — Should this apply to **every** document by default (e.g. `body`, `a`, `html`, unqualified `table`/`p`)? If yes, add minimal rules in **`globals.css`**. **Do not** put **page-specific** or **single-route** UI here (toolbars, hero blocks, a home-only theme switcher)—those are **blocks**; use **`page.css`** next to **`page.tsx`** or a colocated **`components/*.css`** file.
2. **Composition** — Is this only **layout / rhythm** (gap, max-width, grid, vertical flow) with **no** component-specific chrome? Put it in **`compositions.css`**. Prefer **custom properties** for tunable layout so blocks can override without new selectors (see **Compositions and custom properties**).
3. **Utility** — Is it one **named behavior** (what it accomplishes for the UI) that might apply across many components? Put it in **`utilities.css`**. Utilities are **single-purpose, not necessarily single-property**: a class like `.content-column` can set centering + measure + gutter together because that is one intent. **Do not** recreate Tailwind-style **atoms** (`mx-auto`, `px-4`, `max-w-*` as separate utilities) unless there is a strong reuse story—prefer a purpose-led utility or a composition hook instead.
4. **Block** — Does it define **this component’s** look or structure (card, toolbar, table row, HTMX fragment) or a **variant/state** of that component? Put it in a **colocated** stylesheet next to the component.

If unsure between composition and block: **composition** should not care *which* block is inside; **block** CSS should not “own” layout that belongs in compositions or utilities.

## Markup-driven composition

Prefer **composing layout and tweaks in markup** (and in Kitajs `class` strings) from **reusable** composition and utility classes—not one bespoke class per screen. Avoid a single grab-bag “page layout” **block**; instead combine **one composition + one (behavior) utility** (e.g. `[ region ] [ content-column ]`) or tune a composition via **custom properties** from a block stylesheet.

When **building `class` in TypeScript** (e.g. block tokens + `props.class`), use **`mergeClass`** from **`app/src/web/shared/utils/merge_class.ts`** so optional extras don’t add stray spaces; **`Button`** is the reference. See **`kitajs-html-web`**.

Shared wrappers (e.g. **`PageLayout`** in TSX) should emit a **concatenation of existing layer classes** (documented in the component), not introduce a new monolithic selector for the same job.

## Utilities — purpose, not atoms

**Utilities describe what the UI does**, not one CSS property per class. They may bundle several declarations if they implement **one** behavior (e.g. a readable centered column). Prefer that over a pile of atomic utilities that mirror Tailwind.

**Good:** `.content-column` in stylesheets (center + measure + horizontal gutter); in markup often written **`[ content-column ]`** — see **Class order**. `.text-muted` (de-emphasized body text).

**Avoid as default:** `.mx-auto` + `.px-4` + `.max-w-measure` as three utilities for one layout—unless those atoms are genuinely reused in different combinations everywhere.

## Compositions and custom properties

Compositions are the right place for **layout structure** that should stay generic. Give them a small **CSS API** using custom properties: the composition defines **named internal vars** that read from **caller-facing** hooks with fallbacks.

- **Callers** (blocks, pages, or inline `style`) set hooks on the same element or an ancestor—e.g. `--width`, `--measure-max`.
- **Fallbacks** encode the default “no overrides” behavior.
- Optionally namespace the **internal** variables (`--region-*`) while the **hook** stays short (`--width`).

Example (ndb2 `.region` — selector matches the **middle** token when markup uses `[ region ]`):

```css
.region {
  --region-width: var(--width, 100%);
  width: var(--region-width);
  min-width: 0;
}
```

A block can then specialize without duplicating layout logic (the element still carries the `region` class token):

```css
.my_panel.region {
  --width: min(100%, 48rem);
}
```

Behavior utilities can use the same pattern (e.g. `.content-column` with `--measure-max` / `--gutter-inline`).

## Class order in markup (four groups)

Order tokens for human scanning: **compositions → utilities → blocks → exceptions**. When a layer uses **bracket grouping**, write it **literally** in the `class` value.

### Bracket grouping

Each group can be **three class tokens**: an opening bracket, the **real** class name (what your CSS targets), and a closing bracket — e.g. `[` + `region` + `]` so the attribute reads `[ region ]`.

- **Selectors** in CSS stay **`.region`**, **`.content-column`**, **`.theme-switcher`** (the “middle” token only).
- **`[` and `]`** are extra class tokens; leave them **unstyled** (they only help readability). HTML accepts them like any other class name.

Plain classes without brackets are still allowed when you do not need the visual group (e.g. a small fragment).

Rough mapping:

1. **Compositions** — `[ region ]`, `[ cluster ]`, `[ flow ]`, …; may read **`--*`** hooks.
2. **Utilities** — `[ content-column ]`, `[ text-muted ]`, …
3. **Blocks** — `[ theme-switcher ]`, `[ login__action ]` (or unbracketed BEM if preferred).
4. **Exceptions** — Prefer **`data-*`** / **`aria-*`**; extra classes only if needed.

Example:

```html
<div class="[ region ] [ content-column ] [ theme-switcher ]" data-variant="compact"></div>
```

Same idea in Kitajs:

```tsx
<main class="[ region ] [ content-column ] [ dashboard-panel ]">
```

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

## Tokens and theme

- Use **`var(--color-bg)`**, **`var(--space-4)`**, **`var(--text-sm)`**, etc., from **`design-tokens.css`**. Semantic **`--color-*`** are theme-aware; palette remapping for accent schemes uses **`data-color-scheme`** (see **`ndb2-web-design`** for intent; **`css-build`** for emission details).
- Prefer **alias** tokens over raw **`--brand-*`** / **`--scheme-*`** in feature CSS unless you need a fixed step on purpose. For the glass-screen look, **`--color-surface`** / **`--color-surface-muted`** are translucent in **`globals.css`**; keep large areas on those (see **`ndb2-web-design`** / “Layered glass”) instead of opaque fills.

## Checklist before adding new CSS

1. Can **`globals.css`** or an existing composition/utility class cover it?
2. If it’s layout-only, is it reusable across screens? → **compositions** (with **`--*` hooks** when tunable) or **one purpose-led utility**, then **compose in markup**
3. If it’s a named cross-cutting **behavior** → **utilities** (avoid atom classes unless reuse demands it)
4. Otherwise → **colocated block** next to the **`tsx`**
5. Are exceptions expressed with **`data-*`** / **`aria-*`** where appropriate?
6. Does new markup follow **compositions → utilities → blocks → exceptions**, using **literal `[ name ]` groups** when you want bracket scanning?

## Related

- **`app/src/web/shared/utils/merge_class.ts`** — **`mergeClass`**, for TSX `class` when combining bracket groups; **`kitajs-html-web`**.
- **`ndb2-web-design`** — visual mood, how light/dark and named colour schemes fit together.
- **`css-build`** — scripts, `public/` outputs, nodemon, `<head>` link order.
- **`kitajs-html-web`** — route structure, **`HtmlHead`**, HTMX, tests.
