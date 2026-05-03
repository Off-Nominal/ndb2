# Design tokens (initial draft)

**Status:** Token JSON lives under `app/src/web/tokens/`; `build:tokens` emits `src/web/generated/design-tokens.css`. CUBE layers and colocated blocks are bundled by Vite from `styles/cube-entry.css` to `dist/web/public/cube.css` (see `docs/frontend/cube-css.md`). **`HtmlHead`** links a single stylesheet (`cubeStylesheetHref`: dev `/src/web/styles/cube-entry.css`, prod `/assets/cube.css`).

This document seeds our **base design tokens**. These values are a starting point and should be refined once we see real screens (tables, forms, detail pages).

Token sources of truth will ultimately live as JSON and generate:
- CSS custom properties
- token utility classes

**Viewport breakpoints:** `breakpoints.json` emits **`--breakpoint-mobile`**, **`--breakpoint-tablet`**, **`--breakpoint-desktop`**, **`--breakpoint-wide`** on `:root`. Use those **`var(--breakpoint-*)`** in **property values** only; **`@media`** conditions must use the same **`rem`** literals as the JSON (`var()` is not valid in media queries). Tiers and patterns: `.cursor/skills/web-breakpoints/SKILL.md`.

## Design guidance (English)

This is a **dashboard-style, data viewing** application. Most users are here to **find and act on information**.

- **Functional over pretty**: prefer clarity, hierarchy, and scanability over decorative styling.
- **Moderately data-dense**: optimize for tables, filters, and side-by-side comparison.
  - Use spacing and typography to create structure without wasting vertical space.
- **Modern “cosmic” feel, not gimmicky**: lean on subtle color, depth, and contrast—avoid heavy sci‑fi tropes, loud gradients, or novelty type.
- **Supports light + dark mode**: component styling must be expressed via alias tokens that can swap values by theme.

## Color

Primary brand color: **Moonstone Blue** `#73A6C4`

### Brand palette (Moonstone Blue scale)

- `brand.50`: `#F2F8FC`
- `brand.100`: `#DCECF6`
- `brand.200`: `#BFDCEC`
- `brand.300`: `#9CC7E0`
- `brand.400`: `#86B6D2`
- `brand.500`: `#73A6C4` (primary)
- `brand.600`: `#5B8EAC`
- `brand.700`: `#477392`
- `brand.800`: `#345877`
- `brand.900`: `#233B52`

### Neutral palette

- `neutral.0`: `#FFFFFF`
- `neutral.50`: `#F8FAFC`
- `neutral.100`: `#F1F5F9`
- `neutral.200`: `#E2E8F0`
- `neutral.300`: `#CBD5E1`
- `neutral.400`: `#94A3B8`
- `neutral.500`: `#64748B`
- `neutral.600`: `#475569`
- `neutral.700`: `#334155`
- `neutral.800`: `#1F2937`
- `neutral.900`: `#0F172A`

### Semantic (functional) colors

These are for states and messaging; they should be used with neutral surfaces and tokenized text colors for contrast.

- `success.50`: `#ECFDF5`
- `success.500`: `#10B981`
- `success.700`: `#047857`

- `warning.50`: `#FFFBEB`
- `warning.500`: `#F59E0B`
- `warning.700`: `#B45309`

- `danger.50`: `#FEF2F2`
- `danger.500`: `#EF4444`
- `danger.700`: `#B91C1C`

- `info.50`: `#EFF6FF`
- `info.500`: `#3B82F6`
- `info.700`: `#1D4ED8`

### Core alias tokens (how the app should use color)

Prefer these aliases in components/layouts (they can be remapped later without changing markup):

Themeable aliases (these are the tokens the UI should reference).

**Light mode**

- `color.bg`: `neutral.50`
- `color.surface`: `neutral.0`
- `color.surfaceMuted`: `neutral.100`
- `color.border`: `neutral.200`
- `color.text`: `neutral.900`
- `color.textMuted`: `neutral.600`
- `color.link`: `brand.700`
- `color.focusRing`: `brand.500`
- `color.primary`: `brand.500`
- `color.primaryHover`: `brand.600`
- `color.primaryActive`: `brand.700`

**Dark mode**

- `color.bg`: `neutral.900`
- `color.surface`: `neutral.800`
- `color.surfaceMuted`: `neutral.700`
- `color.border`: `neutral.600`
- `color.text`: `neutral.50`
- `color.textMuted`: `neutral.300`
- `color.link`: `brand.300`
- `color.focusRing`: `brand.400`
- `color.primary`: `brand.400`
- `color.primaryHover`: `brand.300`
- `color.primaryActive`: `brand.200`

Semantic alias tokens (themeable as needed; initial mapping):
- `color.success`: `success.500`
- `color.warning`: `warning.500`
- `color.danger`: `danger.500`
- `color.info`: `info.500`

## Spacing

Base unit: 4px. (Spacing tokens are expressed as rem assuming 16px root.)

- `space.0`: `0`
- `space.1`: `0.25rem` (4px)
- `space.2`: `0.5rem` (8px)
- `space.3`: `0.75rem` (12px)
- `space.4`: `1rem` (16px)
- `space.5`: `1.25rem` (20px)
- `space.6`: `1.5rem` (24px)
- `space.8`: `2rem` (32px)
- `space.10`: `2.5rem` (40px)
- `space.12`: `3rem` (48px)
- `space.16`: `4rem` (64px)
- `space.20`: `5rem` (80px)
- `space.24`: `6rem` (96px)

## Radius

- `radius.0`: `0`
- `radius.xs`: `0.125rem` (2px)
- `radius.sm`: `0.25rem` (4px)
- `radius.md`: `0.5rem` (8px)
- `radius.lg`: `0.75rem` (12px)
- `radius.xl`: `1rem` (16px)
- `radius.full`: `9999px`

## Font weight

- `weight.regular`: `400`
- `weight.medium`: `500`
- `weight.semibold`: `600`
- `weight.bold`: `700`

## Font size

- `text.xs`: `0.75rem` (12px)
- `text.sm`: `0.875rem` (14px)
- `text.md`: `1rem` (16px)
- `text.lg`: `1.125rem` (18px)
- `text.xl`: `1.25rem` (20px)
- `text.2xl`: `1.5rem` (24px)
- `text.3xl`: `1.875rem` (30px)
- `text.4xl`: `2.25rem` (36px)

## Line height

- `leading.tight`: `1.15`
- `leading.snug`: `1.3`
- `leading.normal`: `1.5`
- `leading.relaxed`: `1.65`

## Letter spacing

- `tracking.tight`: `-0.01em`
- `tracking.normal`: `0em`
- `tracking.wide`: `0.02em`

