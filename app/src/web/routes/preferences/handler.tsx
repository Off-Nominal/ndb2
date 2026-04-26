import { Router } from "express";
import { z } from "zod";
import { Route } from "@shared/routerMap";
import { getWebAuth } from "../../middleware/auth/session";
import { safeReturnTo } from "../../auth/safeReturnTo";
import {
  buildColorSchemePersistCookieHeader,
  buildThemePreferenceClearCookieHeader,
  buildThemePreferencePersistCookieHeader,
  isColorScheme,
} from "../../middleware/theme-preference";
import { wrapWebRouteWithErrorBoundary } from "../../middleware/error-boundary";

const postPreferencesBodySchema = z.object({
  theme: z.enum(["system", "light", "dark"]),
  colorScheme: z.string().min(1),
  returnTo: z.string().optional(),
  _csrf: z.string().optional(),
});

/**
 * `POST /preferences` — set theme + colour cookies and redirect. CSRF is required
 * when the user has a web session; omitted on pages without one (e.g. login), matching other low-risk prefs UIs.
 */
export const Preferences: Route = (router: Router) => {
  router.post(
    "/preferences",
    wrapWebRouteWithErrorBoundary(async (req, res) => {
      const parsed = postPreferencesBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).type("text/plain").send("Invalid preferences");
        return;
      }
      const { theme, colorScheme: rawScheme, returnTo, _csrf } = parsed.data;
      if (!isColorScheme(rawScheme)) {
        res.status(400).type("text/plain").send("Invalid color scheme");
        return;
      }
      const colorScheme = rawScheme;

      const auth = getWebAuth();
      if (auth.status === "authenticated") {
        if (_csrf !== auth.csrfToken) {
          res.status(403).type("text/plain").send("Invalid CSRF token");
          return;
        }
      }

      if (theme === "system") {
        res.append("Set-Cookie", buildThemePreferenceClearCookieHeader());
      } else {
        res.append("Set-Cookie", buildThemePreferencePersistCookieHeader(theme));
      }
      res.append("Set-Cookie", buildColorSchemePersistCookieHeader(colorScheme));

      const target = safeReturnTo(returnTo, "/");
      if (req.get("hx-request") === "true") {
        res.setHeader("HX-Refresh", "true");
        res.status(200).end();
        return;
      }
      res.redirect(303, target);
    }),
  );
};
