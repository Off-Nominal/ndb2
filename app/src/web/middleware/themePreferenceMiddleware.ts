import { AsyncLocalStorage } from "node:async_hooks";
import type { RequestHandler } from "express";

/** Cookie name for persisted color scheme (`light` | `dark`). Absent = follow OS (`system`). */
export const THEME_COOKIE_NAME = "ndb2_theme";

/** Must match `MAX_AGE_SEC` in `routes/home/page.client.js`. */
export const THEME_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 400;

export type ThemePreference = "light" | "dark" | "system";

const themePreferenceAsyncLocalStorage = new AsyncLocalStorage<ThemePreference>();

/** Theme for the current request (set by {@link themePreferenceMiddleware}). */
export function getThemePreference(): ThemePreference {
  return themePreferenceAsyncLocalStorage.getStore() ?? "system";
}

/** Read theme from raw `Cookie` header. Unknown or missing values → `system`. */
export function parseThemeCookie(cookieHeader: string | undefined): ThemePreference {
  if (!cookieHeader) return "system";
  const escaped = THEME_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  if (!match) return "system";
  const raw = decodeURIComponent(match[1].trim());
  if (raw === "light" || raw === "dark") return raw;
  return "system";
}

export const themePreferenceMiddleware: RequestHandler = (req, _res, next) => {
  const theme = parseThemeCookie(req.headers.cookie);
  themePreferenceAsyncLocalStorage.run(theme, () => next());
};
