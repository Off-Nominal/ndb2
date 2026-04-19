import { AsyncLocalStorage } from "node:async_hooks";
import type { RequestHandler } from "express";

/**
 * Theme persistence cookie — duplicated in `routes/home/page.client.js` (keep in sync).
 * Rolling `Max-Age` is refreshed on each HTML request when preference is `light`/`dark`.
 */
export const THEME_COOKIE_CONFIG = {
  /** Persisted `light` | `dark`; absent ⇒ `system` (OS). */
  name: "ndb2_theme",
  path: "/",
  /** Rolling window seconds (browser caps apply; ~400d is a common upper bound). */
  maxAgeSec: 60 * 60 * 24 * 400,
  sameSite: "Lax",
} as const;

/** `Set-Cookie` value for a persisted light/dark choice (non-HttpOnly; client island may update). */
export function buildThemePreferencePersistCookieHeader(theme: "light" | "dark"): string {
  const c = THEME_COOKIE_CONFIG;
  return `${c.name}=${encodeURIComponent(theme)}; Path=${c.path}; Max-Age=${c.maxAgeSec}; SameSite=${c.sameSite}`;
}

/** `Set-Cookie` value that clears the cookie (switch to `system`). */
export function buildThemePreferenceClearCookieHeader(): string {
  const c = THEME_COOKIE_CONFIG;
  return `${c.name}=; Path=${c.path}; Max-Age=0; SameSite=${c.sameSite}`;
}

export type ThemePreference = "light" | "dark" | "system";

const themePreferenceAsyncLocalStorage = new AsyncLocalStorage<ThemePreference>();

/** Theme for the current request (set by {@link themePreferenceMiddleware}). */
export function getThemePreference(): ThemePreference {
  return themePreferenceAsyncLocalStorage.getStore() ?? "system";
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

export const themePreferenceMiddleware: RequestHandler = (req, res, next) => {
  const theme = parseThemeCookie(req.headers.cookie);
  if (theme === "light" || theme === "dark") {
    res.append("Set-Cookie", buildThemePreferencePersistCookieHeader(theme));
  }
  themePreferenceAsyncLocalStorage.run(theme, () => next());
};
