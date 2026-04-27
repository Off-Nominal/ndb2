---
name: web-breakpoints
description: >-
  Canonical ndb2 viewport tiers: mobile, tablet, desktop, wide — rem/px cut points, mobile-first
  `min-width` @media patterns, and how they relate to shell/nav layout. Use when writing or reviewing
  responsive CSS, choosing min-width queries, or describing layout behavior by viewport—not for the CSS
  build pipeline (css-build) or colour/theme (ndb2-web-design).
---

# Web breakpoints — viewport tiers (ndb2)

**Scope:** Named **viewport ranges** and **authoring conventions** for hand-written CSS under `app/src/web` (blocks, compositions, utilities). **Not** here: token build mechanics (**`css-build`**), or visual palette / glass treatment (**`ndb2-web-design`**).

**Assumption:** `1rem` = **16px** (browser default root), consistent with spacing/type tokens in **`docs/frontend/design.md`**.

## Four named tiers

These are the **canonical** ndb2 labels. Use them in comments, PRs, and skills so “tablet” always means the same range.

| Tier | Width (range) | `min-width` “and up” | Typical use |
|------|------------------|----------------------|-------------|
| **Mobile** | **under 48rem** (under 768px) | *(base styles; no `min-width`)* | Single column, drawers, touch-first chrome |
| **Tablet** | **48rem** through **63rem** inclusive (conceptually “until desktop”) | **`48rem`** | Collapsible side regions, denser two-column shells |
| **Desktop** | **64rem** through **79rem** inclusive | **`64rem`** | Persistent nav columns, comfortable measure |
| **Wide** | **80rem and up** | **`80rem`** | Extra horizontal room, wide grids, loosened max-widths |

**Authoring rule:** use **mobile-first** styles as the default, then **`@media (min-width: …)`** for larger tiers. **Do not** use **`max-width: 63.99rem`** (or other fractional rem “gap” tricks) to avoid overlapping `min-width` bands. For “desktop and up” behavior, add overrides at **`min-width: 64rem`**. For “tablet vs desktop” differences, layer **`min-width: 48rem`** first, then **`min-width: 64rem`** to relax or replace tablet-only rules—no **bounded** `max-width` media for tier boundaries.

## Cut points (single source of truth)

| Token name (concept) | rem | px @ 16px root | CSS variable (`design-tokens.css`) |
|----------------------|-----|------------------|-------------------------------------|
| **Tablet** (start) | `48rem` | 768 | **`--breakpoint-tablet`** |
| **Desktop** (start) | `64rem` | 1024 | **`--breakpoint-desktop`** |
| **Wide** (start) | `80rem` | 1280 | **`--breakpoint-wide`** |

**Source of truth:** `app/src/web/tokens/breakpoints.json` → `build:tokens` → **`--breakpoint-*`** on **`:root`**.

### `var()` and `@media` — important

**Do not** use **`var(--breakpoint-…)`** inside **`@media (min-width: …)`** (or any media condition). Per CSS, **`var()` is only for property values**; media queries are evaluated in a context where element custom properties are not available, so **`@media (min-width: var(--breakpoint-desktop))` is invalid / ignored** in practice.

**Do this instead:**

- In **`@media`**, write the **same `rem` literal** as in **`breakpoints.json`** (`48rem`, `64rem`, `80rem`).
- Add a **short comment** when it helps: `/* = breakpoint.desktop in breakpoints.json */`.

Use **`var(--breakpoint-*)`** only where custom properties are allowed — e.g. **`width: min(100%, var(--breakpoint-wide))`**, **`max-width`**, spacing math — **not** in the media condition itself.

Author hand-written CSS with these **`rem`** semantics so zoom and user font settings stay predictable. Avoid raw **`px`** for tier boundaries unless matching a legacy exception.

## Query patterns

**Mobile-first** (required): layer enhancements upward with **`min-width` only**.

```css
/* base: mobile (narrowest) */

@media (min-width: 48rem) {
  /* tablet and up */
}

@media (min-width: 64rem) {
  /* desktop and up (overrides tablet where needed) */
}

@media (min-width: 80rem) {
  /* wide and up */
}
```

**Tablet-only behavior** (when you truly need something only between tablet start and desktop start): express it as **base or `min-width: 48rem`**, then **undo** at **`min-width: 64rem`** — not as `and (max-width: …)`.

```css
@media (min-width: 48rem) {
  .foo {
    /* tablet enhancement */
  }
}

@media (min-width: 64rem) {
  .foo {
    /* reset or replace for desktop */
  }
}
```

**Combine tiers** when behavior matches (e.g. drawer for both phone and tablet): keep **one** default block for all narrow layouts, and **one** `@media (min-width: 64rem)` for desktop.

## Shell, nav, and glass

**Authenticated** layout (**`AuthenticatedPageLayout`**, **`page-layout`**, **`site-nav`**) may switch behavior by tier (drawer vs column, scrim, second **`glass-background`** sheet vs transparent nav strip). **Visual rules** for that split live in **`ndb2-web-design`** (*Layered glass*). **Which viewport widths** trigger those rules follow **this skill**; implementation details live in **`page-layout/page-layout.css`** (update that file when tier behavior changes).

## Related

- **`cube-css-authoring`** — which stylesheet layer owns responsive rules; nesting **`@media`** under a block root.
- **`ndb2-web-design`** — glass / nav *appearance* by coarse viewport (references this skill for tier boundaries).
- **`kitajs-html-web`** — **`PageLayout`** / **`AuthenticatedPageLayout`** markup; nav chrome is TSX + colocated CSS.
- **`css-build`** — how colocated **`*.css`** reaches **`blocks.css`**.
- **`docs/frontend/cube-css.md`** — CUBE summary; links here for responsive authoring.
