---
name: web-breakpoints
description: >-
  Canonical ndb2 viewport tiers: narrow base, breakpoint.mobile (36rem), tablet, desktop, wide — rem cut
  `min-width` @media patterns, and how they relate to shell/nav layout. Use when writing or reviewing
  responsive CSS, choosing min-width queries, or describing layout behavior by viewport—not for the CSS
  build pipeline (css-build) or colour/theme (ndb2-web-design).
---

# Web breakpoints — viewport tiers (ndb2)

**Scope:** Named **viewport ranges** and **authoring conventions** for hand-written CSS under `app/src/web` (blocks, compositions, utilities). **Not** here: token build mechanics (**`css-build`**), or visual palette / glass treatment (**`ndb2-web-design`**).

**Assumption:** `1rem` = **16px** (browser default root), consistent with spacing/type tokens in **`docs/frontend/design.md`**.

## Named tiers + mobile cut

These are the **canonical** ndb2 labels. Use them in comments, PRs, and skills so “tablet” always means the same range.

**Within “mobile” (under `48rem`):** **`breakpoints.json`** also defines **`breakpoint.mobile`** at **`36rem`** (576px) — the first step up from the narrowest base. Use it for “small phone only” vs “larger phone / phablet” splits; **tablet** still starts at **`48rem`**.

| Tier | Width (range) | `min-width` “and up” | Typical use |
|------|------------------|----------------------|-------------|
| **Narrow (base)** | **under 36rem** (under 576px) | *(base styles; no `min-width`)* | Tightest single-column, extra truncation / stacked chrome |
| **Mobile (comfort)** | **36rem** through **47.99…** (conceptually until tablet) | **`36rem`** | Larger phones; relax narrow-only rules before tablet layout |
| **Tablet** | **48rem** through **63rem** inclusive (conceptually “until desktop”) | **`48rem`** | Collapsible side regions, denser two-column shells |
| **Desktop** | **64rem** through **79rem** inclusive | **`64rem`** | Comfortable measure; multi-column dashboards (authenticated **`page-layout`** still drawer until **wide**) |
| **Wide** | **80rem and up** | **`80rem`** | Persistent site nav column (`page-layout`), extra horizontal room, wide grids |

**Authoring rule:** use **mobile-first** styles as the default, then **`@media (min-width: …)`** for larger tiers. **Do not** use **`max-width: 63.99rem`** (or other fractional rem “gap” tricks) to avoid overlapping `min-width` bands. For “desktop and up” behavior, add overrides at **`min-width: 64rem`**. For “tablet vs desktop” differences, layer **`min-width: 48rem`** first, then **`min-width: 64rem`** to relax or replace tablet-only rules—no **bounded** `max-width` media for tier boundaries.

## Cut points (single source of truth)

| Token name (concept) | rem | px @ 16px root | CSS variable (`design-tokens.css`) |
|----------------------|-----|------------------|-------------------------------------|
| **Mobile** (start, within handsets) | `36rem` | 576 | **`--breakpoint-mobile`** |
| **Tablet** (start) | `48rem` | 768 | **`--breakpoint-tablet`** |
| **Desktop** (start) | `64rem` | 1024 | **`--breakpoint-desktop`** |
| **Wide** (start) | `80rem` | 1280 | **`--breakpoint-wide`** |

**Source of truth:** `app/src/web/tokens/breakpoints.json` → `build:tokens` → **`--breakpoint-*`** on **`:root`**.

### `var()` and `@media` — important

**Do not** use **`var(--breakpoint-…)`** inside **`@media (min-width: …)`** (or any media condition). Per CSS, **`var()` is only for property values**; media queries are evaluated in a context where element custom properties are not available, so **`@media (min-width: var(--breakpoint-desktop))` is invalid / ignored** in practice.

**Do this instead:**

- In **`@media`**, write the **same `rem` literal** as in **`breakpoints.json`** (`36rem`, `48rem`, `64rem`, `80rem`).
- Add a **short comment** when it helps: `/* = breakpoint.desktop in breakpoints.json */`.

Use **`var(--breakpoint-*)`** only where custom properties are allowed — e.g. **`width: min(100%, var(--breakpoint-wide))`**, **`max-width`**, spacing math — **not** in the media condition itself.

Author hand-written CSS with these **`rem`** semantics so zoom and user font settings stay predictable. Avoid raw **`px`** for tier boundaries unless matching a legacy exception.

## Query patterns

**Mobile-first** (required): layer enhancements upward with **`min-width` only**.

```css
/* base: narrow (smallest phones) */

@media (min-width: 36rem) {
  /* larger phone / phablet and up */
}

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

**Combine tiers** when behavior matches (e.g. **`page-layout`** drawer rail until **`min-width: 80rem`**, then persistent nav column): keep **one** default block for narrower layouts, then **`@media`** overrides at the breakpoint where behavior changes (see **`page-layout/page-layout.css`**).

## Shell, nav, and glass

**Authenticated** layout (**`AuthenticatedPageLayout`**, **`page-layout`**, **`site-nav`**) switches drawer vs persistent column at **`breakpoint.wide` (`80rem`)**; other shell details (scrim, second **`glass-background`** sheet vs transparent nav strip) follow **`ndb2-web-design`** (*Layered glass*). **Which viewport widths** trigger those rules follow **this skill**; implementation details live in **`page-layout/page-layout.css`** (update that file when tier behavior changes).

## Related

- **`cube-css-authoring`** — which stylesheet layer owns responsive rules; nesting **`@media`** under a block root.
- **`ndb2-web-design`** — glass / nav *appearance* by coarse viewport (references this skill for tier boundaries).
- **`kitajs-html-web`** — **`PageLayout`** / **`AuthenticatedPageLayout`** markup; nav chrome is TSX + colocated CSS.
- **`css-build`** — how colocated **`*.css`** reaches **`cube.css`** (via **`cube-blocks.css`**).
- **`docs/frontend/cube-css.md`** — CUBE summary; links here for responsive authoring.
