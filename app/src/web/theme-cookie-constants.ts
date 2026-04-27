/**
 * Theme persistence: values `light` | `dark`; absence means `system` (OS) in middleware.
 * Shared with the browser preferences UI and theme rolling refresh.
 */
export const THEME_COOKIE_CONFIG = {
  name: "ndb2_theme",
  path: "/",
  maxAgeSec: 60 * 60 * 24 * 400,
  sameSite: "Lax",
} as const;

/**
 * Accent / palette (`data-color-scheme`); ids in `src/web/tokens/scheme-hue-defs.ts`.
 * Rolling `Max-Age` is refreshed on HTML requests when a valid value is present.
 */
export const COLOR_SCHEME_COOKIE_CONFIG = {
  name: "ndb2_color_scheme",
  path: "/",
  maxAgeSec: 60 * 60 * 24 * 400,
  sameSite: "Lax",
} as const;
