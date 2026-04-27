import { AsyncLocalStorage } from "node:async_hooks";
import type { RequestHandler } from "express";
import {
  COLOR_SCHEME_COOKIE_CONFIG,
  THEME_COOKIE_CONFIG,
} from "../theme-cookie-constants.js";
import {
  type ColorScheme,
  SCHEME_HUE_DEFS,
} from "../tokens/scheme-hue-defs.js";

export type { ColorScheme } from "../tokens/scheme-hue-defs.js";
export { SCHEME_HUE_DEFS };
export { COLOR_SCHEME_COOKIE_CONFIG, THEME_COOKIE_CONFIG };

const ALL_SCHEMES: readonly ColorScheme[] = SCHEME_HUE_DEFS.map((h) => h.id);
export const COLOR_SCHEME_VALUES: readonly ColorScheme[] = SCHEME_HUE_DEFS.map((h) => h.id);

const LEGACY_COLOR_SCHEME: Record<string, ColorScheme> = {
  red: "redshift",
  green: "aurora",
  yellow: "helios",
  blue: "neptune",
  orange: "titan",
  purple: "nebula",
};

function normalizeColorSchemeToken(raw: string | undefined | null): ColorScheme {
  if (raw == null || raw === "") return "neptune";
  const fromLegacy = LEGACY_COLOR_SCHEME[raw];
  const candidate = fromLegacy ?? raw;
  if (ALL_SCHEMES.includes(candidate as ColorScheme)) {
    return candidate as ColorScheme;
  }
  return "neptune";
}

export function isColorScheme(value: string | undefined | null): value is ColorScheme {
  return value != null && ALL_SCHEMES.includes(value as ColorScheme);
}

/** `Set-Cookie` value for a persisted light/dark choice (non-HttpOnly). */
export function buildThemePreferencePersistCookieHeader(theme: "light" | "dark"): string {
  const c = THEME_COOKIE_CONFIG;
  return `${c.name}=${encodeURIComponent(theme)}; Path=${c.path}; Max-Age=${c.maxAgeSec}; SameSite=${c.sameSite}`;
}

/** `Set-Cookie` value that clears the theme cookie (switch to `system`). */
export function buildThemePreferenceClearCookieHeader(): string {
  const c = THEME_COOKIE_CONFIG;
  return `${c.name}=; Path=${c.path}; Max-Age=0; SameSite=${c.sameSite}`;
}

export function buildColorSchemePersistCookieHeader(scheme: ColorScheme): string {
  const c = COLOR_SCHEME_COOKIE_CONFIG;
  return `${c.name}=${encodeURIComponent(scheme)}; Path=${c.path}; Max-Age=${c.maxAgeSec}; SameSite=${c.sameSite}`;
}

export type ThemePreference = "light" | "dark" | "system";

const themePreferenceAsyncLocalStorage = new AsyncLocalStorage<ThemePreference>();
const colorSchemeAsyncLocalStorage = new AsyncLocalStorage<ColorScheme>();

/** Theme for the current request (set by {@link themePreferenceMiddleware}). */
export function getThemePreference(): ThemePreference {
  return themePreferenceAsyncLocalStorage.getStore() ?? "system";
}

/**
 * Active palette id (`data-color-scheme`); `brand.*` / `neutral.*` in tokens resolve against it.
 * Default is `neptune` when the cookie is missing or invalid.
 */
export function getColorScheme(): ColorScheme {
  return colorSchemeAsyncLocalStorage.getStore() ?? "neptune";
}

/** Read theme from raw `Cookie` header. Unknown or missing values → `system`. */
export function parseThemeCookie(cookieHeader: string | undefined): ThemePreference {
  if (!cookieHeader) return "system";
  const escaped = THEME_COOKIE_CONFIG.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  if (!match) return "system";
  const raw = decodeURIComponent(match[1].trim());
  if (raw === "light" || raw === "dark") return raw;
  return "system";
}

/**
 * Read persisted palette id from raw `Cookie` header, without legacy migration.
 * absent → `undefined` (treat as default `neptune` for rendering without rolling `Set-Cookie`).
 */
export function parseColorSchemeCookieValue(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  const escaped = COLOR_SCHEME_COOKIE_CONFIG.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  if (!match) return undefined;
  return decodeURIComponent(match[1].trim());
}

export const themePreferenceMiddleware: RequestHandler = (req, res, next) => {
  const theme = parseThemeCookie(req.headers.cookie);
  if (theme === "light" || theme === "dark") {
    res.append("Set-Cookie", buildThemePreferencePersistCookieHeader(theme));
  }

  const rawScheme = parseColorSchemeCookieValue(req.headers.cookie);
  const colorScheme = normalizeColorSchemeToken(rawScheme);
  const shouldRefresh =
    isColorScheme(rawScheme) ||
    (rawScheme != null && Object.prototype.hasOwnProperty.call(LEGACY_COLOR_SCHEME, rawScheme));
  if (shouldRefresh) {
    res.append("Set-Cookie", buildColorSchemePersistCookieHeader(colorScheme));
  }

  themePreferenceAsyncLocalStorage.run(theme, () =>
    colorSchemeAsyncLocalStorage.run(colorScheme, next),
  );
};
