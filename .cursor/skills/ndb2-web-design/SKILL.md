---
name: ndb2-web-design
description: >-
  NDB2 web visual design: futuristic terminal / HUD, glassy screen-overlay feel, space-named
  colour palettes (Neptune, Aurora, etc.), how light/dark and accent schemes combine, and
  semantic tokens. Use when choosing colours, describing look and feel, or styling to match
  the product personality—not for UX flows, accessibility rules, or CSS build mechanics (use
  css-build).
---

# NDB2 web — visual design and theming

**Scope:** Look and feel only (colour, mood, theme *appearance*). **Not** here: interaction design, accessibility policy, or how the CSS pipeline runs (see **`css-build`**); where to put CSS rules (see **`cube-css-authoring`**).

## What the site should feel like

- **Visual metaphor:** a **futuristic terminal or shipboard display**—the glassy, layered overlay of a **far-future screen interface** (HUD / mission UI). It should feel *fun* and distinctive without turning into a toy. Readability and calm scanning come first: plenty of contrast, clear type, generous spacing where it helps—**never** sacrifice legibility for chrome.
- **How to get there (taste, not a checklist):** light **glass** or frosted panels, crisp edges, subtle depth (borders, soft shadows, thin dividers) rather than flat wallpaper. Optional winks: monospace for **labels, meta, or code**, a faint grid or scanline *hint*, accent glow on focus—**sparingly**. Avoid heavy tropes: full-screen “Matrix” density, constant animation, loud neon, illegible “tech” type for body text, or busy starfield backgrounds behind primary content.
- **Naming and colour:** **space exploration** still frames the **palette names** (Neptune, Redshift, Aurora, Helios, Titan, Nebula)—they read as *instrument channels* or mission themes, not generic rainbow pickers. Keep the “mission control” tone: **dashboard / data product** clarity, moderate density, structure from hierarchy and spacing, not from clutter.
- **Default accent** is the cool **Moonstone** family bound to the **Neptune** palette in tokens (`scheme.neptune.*` as the source for `brand.*` in the default case).

Deeper token history and hex tables (may lag named schemes): [`docs/frontend/design.md`](docs/frontend/design.md).

## Layered glass (base screen vs content)

- **`body`** + **`[ glass-background ]`** (see **`utilities.css`**) is the **base** display glass: gradient, grid, accent radials, **opaque** diagonal (no frosted `color-surface` in that stack). On **phone/tablet** the right nav reuses the same **`.glass-background`** (second sheet on top, same skin). On **wide/desktop** the **nav column** is not a second stack—**transparent**, side by side on the single body layer.
- **Foreground UI** (inputs, cards, table chrome) still uses translucency via **`--color-surface*`** in **`globals.css`** where appropriate.
- **Do not** stack another full-page opaque background on the main column—let the shell read as one continuous display. New blocks should default to translucent surfaces or borders-only until a solid is justified.

## Two independent choices

1. **Light / dark / system (appearance)** — *how bright the UI is* (backgrounds, text, surfaces).  
2. **Accent colour scheme** — *which hue family* powers primary UI colour (`brand.*`) and the paired neutral ramp for surfaces/borders/text greys.

They multiply: you can be **dark** + **Aurora**, or **light** + **Titan**, etc. Implementations must keep both in mind (`data-theme` and `data-color-scheme` on `<html>`).

## Light, dark, and system

- **Semantic colour** for components uses aliases such as `var(--color-bg)`, `var(--color-text)`, `var(--color-primary)` — **not** raw `brand-500` in feature CSS unless you truly need a fixed palette step.
- **Token shape:** `color.light.*` and `color.dark.*` in `colors.json` resolve to the same `--color-*` names; the build emits **`html[data-theme="dark"]`** and a **`prefers-color-scheme: dark`** block for **`html[data-theme="system"]`** so “system” tracks the OS.
- **Persistence:** non-HttpOnly cookie **`ndb2_theme`**: `light` or `dark` when the user has chosen; **absent** means **system** (follow OS). Rolling refresh is applied on HTML responses when a stored value exists.
- **Runtime:** `getThemePreference()` in `theme-preference.ts` + colocated `page.client.js` (home) keep `<html data-theme="…">` in sync.

User-facing “Appearance” (System / Light / Dark) controls only this axis.

## Accent colour schemes (named palettes)

- **Authoritative list:** `app/src/web/tokens/scheme-hue-defs.ts` — each entry is an `id` (cookie / `data-color-scheme` value) and a **user-facing label** (e.g. Neptune, Redshift). Keep JSON tokens and the design-token build aligned with this file.
- **Token model:**
  - **`scheme.<id>.<50–900>`** — accent ramp; exposed as e.g. `--scheme-neptune-500`. This is the raw palette for that scheme.
  - **`scheme.<id>.neutral.<50–900>`** — surface / grey ramp *matched* to that accent (separate from accent hues).
  - **`brand.*`** in `:root` points at the **default** scheme (Neptune); **`neutral.*` (50–900)** at Neptune neutrals. **`html[data-color-scheme="<id>"]`** remaps both **`--brand-*`** and **`--neutral-*`** to the right `scheme.<id>.*` and `scheme.<id>.neutral.*` so semantic tokens stay stable.
- **Default:** `neptune` when no cookie (Moonstone-leaning blue accent + slate-style neutrals for that id).
- **Persistence:** non-HttpOnly cookie **`ndb2_color_scheme`** stores the `id` when the user has chosen; rolling refresh when set. **Legacy** short names (`blue`, `red`, …) in old cookies are mapped to the new ids in middleware (e.g. `blue` → `neptune`).

For **implementation** details (file paths, `Set-Cookie`, client script duplication): `theme-preference.ts` and `routes/home/page.client.js`.

## What not to conflate

- **Semantic UI colour** = `--color-*` (theme-aware). **Brand steps** = `--brand-*` (remapped by colour scheme). **Raw scheme steps** = `--scheme-<id>-*` for debugging or rare fixed marketing pieces—prefer aliases in product UI.
- **This skill** does not define WCAG requirements or focus behaviour; if the task is accessibility, use project a11y rules and tests—not “make it pretty” from here alone.

## Related

- **`css-build`** — `build:tokens` / `build:css`, `design-tokens.css` output, `HtmlHead` order, when to run builds.
- **`cube-css-authoring`** — which stylesheet layer to extend; still use **semantic** `var(--color-*)` in hand-written CSS.
- **`kitajs-html-web`** — `PageLayout` / `AuthenticatedPageLayout` pass `theme` and `colorScheme` into the document; only the authenticated layout includes site nav.
