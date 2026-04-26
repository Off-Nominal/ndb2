---
name: cube-css-authoring
description: >-
  CUBE CSS authoring for ndb2: which layer (globals, compositions, utilities, colocated block).
  Colocated block CSS must use one root selector (e.g. `.form-field`) and native `&` nesting for
  children and states — not multiple parallel top-level `.block-*` stanzas for the same component, and not
  new BEM `block__element` classes for routine structure. Use mergeClass and bracket groups in TSX, tokens,
  section comments, in-rule property groups. Triggers: styling a component, block CSS, nesting,
  form-field, site-nav, wrong layer. For build scripts and file outputs, use css-build.
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

## Nesting states in the parent (native `&`)

For a **single** block or utility, keep **base + interactive states** in **one** rule: use **native CSS nesting** with **`&`** (`&:hover`, `&:focus-visible`, `&:active`, etc.) instead of repeating a second top-level selector like `.my_block:hover` below `.my_block`.

- **Why:** One place to read and edit; the component or utility stays **self-contained** (see e.g. **`.screen-element`** in **`utilities.css`**).
- **When to split:** Rare — e.g. a state shared across many unrelated selectors, or a deliberate override file.
- **Support:** Styles are **copied as-is** to **`/assets`** (no PostCSS flatten). Nesting targets **evergreen** browsers; see **`css-build`**.

Example:

```css
.screen-element {
  border: 1px solid var(--color-primary);
  /* … */

  &:hover {
    box-shadow: /* … */;
  }

  &:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
  }
}
```

Same idea in **colocated block** CSS (e.g. `.button` + `&:hover` in **`button.css`**).

## Nesting child and element rules under the block root

Rules that only apply to **this** block’s **DOM subtree** should live **inside** the root class with **`&`**, not as **repeated top-level** selectors that share the same block prefix.

- **Do:** one **`.my_block { … }`** and nest `& > form`, `& > li`, `& *`, `& .button` (when scoped to this block), `&[data-open]`, etc.
- **Don’t (by default):** several parallel roots like `.my_block { }`, then `.my_block > form { }` further down the file, then `.my_block__footer .button { }` for the same component — that scatters one block and invites duplicate naming.
- **Do not** introduce **BEM-style** class names of the form **`block__element`** or **`block__element--modifier`** for routine structure and layout (e.g. **`app-shell__grid`**, **`app-shell__main`**, **`app-shell__main--solo`**). That pattern duplicates “block + element + modifier” families instead of CUBE. **Prefer instead:** a **single block** root for the colocated component (e.g. **`.page-layout`** in **`page-layout.css`**), **child/region rules nested with `&`** under that root, **composition** classes from **`compositions.css`** for shared layout (flow, region, grid primitives), and **`data-*` / `data-variant`** (see **Exceptions**) for state and variants—not `--solo`-style class suffixes. **`app-shell__*`** in **`page-layout`** is **legacy**; new work should not copy that naming—extend the owning **block** and **compositions** above.
- **BEM `__element` in markup** is reserved for **rare** cases: a **stable named** hook (multiple elements of the same kind, **variants** shared with tests/JS, or a hook you truly cannot express with **`&`** and structure). It is **not** the default way to name every inner node. If you have a **single** form, `& > form` nested under `.site-nav` is enough; you may **omit** a `site-nav__logout` class.
- **Another host node** in the same file (e.g. **`.app-nav`** on `aside` and **`.site-nav`** on `nav`) is still **two** top-level rules when the DOM is two elements—fine; a one-line cross-reference comment in the file is enough.

```css
.site-nav {
  display: flex;
  flex-direction: column;
  /* … */

  & * {
    display: block;
    width: 100%;
  }

  & > form {
    margin-block-start: auto;

    & .button {
      width: 100%;
      box-sizing: border-box;
    }
  }
}
```

**Pair with** **Nesting states in the parent** and **Sectioning a block file** (section headers for `@media` or truly separate concerns).

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

- **Selectors** in CSS stay **`.region`**, **`.content-column`**, **`.theme-selector`** (the “middle” token only).
- **`[` and `]`** are extra class tokens; leave them **unstyled** (they only help readability). HTML accepts them like any other class name.

Plain classes without brackets are still allowed when you do not need the visual group (e.g. a small fragment).

Rough mapping:

1. **Compositions** — `[ region ]`, `[ cluster ]`, `[ flow ]`, …; may read **`--*`** hooks.
2. **Utilities** — `[ content-column ]`, `[ text-muted ]`, …
3. **Blocks** — one **kebab-case** name per block (e.g. **`[ page-layout ]`**, **`[ theme-selector ]`**). **Do not** add **`block__child`**-style class tokens for normal inner layout; nest under the block in CSS (see *Nesting child and element rules* and the **BEM-style** note above). Older markup may still show **`[ login__action ]`**, **`login__action`**-style names—**new** blocks should not add more of that family.
4. **Exceptions** — Prefer **`data-*`** / **`aria-*`**; extra classes only if needed.

Example:

```html
<div class="[ region ] [ content-column ] [ theme-selector ]" data-variant="compact"></div>
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

### Sectioning a block file (selectors + declaration groups)

In **colocated** `*.css` (one component or one page’s blocks), use **short comments** in two ways:

1. **Between selectors (file structure)**  
   Banners `/* — Label — */` **above** a top-level rule when you really have a **separate** concern (another host element, a **@media** block, keyframes). For **one** block component, **nest** `&` rules under the root instead of many parallel top-level **`.block …`** stanzas — see **Nesting child and element rules under the block root**. Labels should be **specific** (e.g. `Aside: flex for nav height`, not “part 2”).

2. **Inside a rule (declaration groups)**  
   Within a single `{ … }` block, group **properties by what they do**, not at random. Typical buckets (add **inline** `/* layout */`, `/* type */`, `/* color & surface */`, `/* shape / border */`, `/* effects */`, `/* interaction */` — use the names that fit the rule):

| Group | What goes here (examples) |
|-------|----------------------------|
| **Layout** | `display`, `position`, `inset`, `z-index`, `box-sizing`, width/height/min/max, **margin, padding**, **flex**, **grid**, `gap`, `align-*`, `justify-*`, `overflow` |
| **Type** | `font`, `line-height`, `letter-spacing`, `text-align`, `text-decoration`, `white-space` |
| **Color & surface** | `color`, `background`, `border-color` (or full `border` when it is mostly paint); **opacity** when it reads as “ink”/fill |
| **Shape** | `border-width`, `border-style`, `border-radius`, `outline` (when mostly geometric) — or fold **shorthand** `border` with color in one place under “color & surface” if you prefer not to split |
| **Effects** | `box-shadow`, `filter`, `backdrop-filter` (often paired with `screen-element`-style chrome) |
| **Interaction** | `cursor`, `pointer-events`, `user-select`, `transition`, `appearance` / vendor resets, touch-action |

**Order inside the rule (loose convention):** **layout** → **type** → **color & surface** → **shape** (if not merged) → **effects** → **interaction** — so **padding/margin/flex/grid** come before **colours** where both appear.

**Small rules:** if a class only has a few properties, one group or no in-rule comments is fine; do not pad for the sake of it.

**File lead** (`/* Block: … */` or `/* <Feature> page — … */`) stays at the very top. Put **@keyframes** and **print** at the **end** with their own header.

This does not change the build; it is for authors and review.

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
7. For new **`:hover` / `:focus` / `:focus-visible`** on one class, are they **nested under that class** with **`&`** instead of a separate top-level selector (unless there is a reason not to)?
8. In colocated **block** CSS, are **comment headers** used to group **selectors** where helpful, and **in-rule groups** (layout, type, color & surface, …) when a rule is non-trivial (and is the file lead still accurate)?
9. For **one** block, are **child/element** rules **nested** under the root with **`&`** (instead of many parallel top-level `.block …` / `.block__el` rules and extra markup classes where structure is enough)? **Have you avoided** new BEM-style **`app-shell__grid`**-style `__` chains in favor of that nesting + **compositions** (see the **BEM-style** callout in *Nesting child and element rules*)?

## Related

- **`app/src/web/shared/utils/merge_class.ts`** — **`mergeClass`**, for TSX `class` when combining bracket groups; **`kitajs-html-web`**.
- **`ndb2-web-design`** — visual mood, how light/dark and named colour schemes fit together.
- **`css-build`** — scripts, `public/` outputs, nodemon, `<head>` link order.
- **`kitajs-html-web`** — route structure, **`HtmlHead`**, HTMX, tests.
