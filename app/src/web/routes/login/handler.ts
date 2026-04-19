import { Router } from "express";
import { Route } from "@shared/routerMap";
import { safeReturnTo } from "../../auth/safeReturnTo";
import { getWebAuth } from "../../middleware/webAuthMiddleware";
import { getThemePreference } from "../../middleware/themePreferenceMiddleware";
import { login_page } from "./page";

/** Public `GET /login` with explicit control to start Discord OAuth. */
export const Login: Route = (router: Router) => {
  router.get("/login", async (req, res, next) => {
    try {
      const auth = getWebAuth();
      const rawReturnTo =
        typeof req.query.returnTo === "string" ? req.query.returnTo : undefined;
      const returnTo = safeReturnTo(rawReturnTo);

      if (auth.status === "authenticated") {
        const destination = returnTo === "/login" ? "/" : returnTo;
        res.redirect(302, destination);
        return;
      }

      const html = await Promise.resolve(
        login_page({
          returnTo,
          theme: getThemePreference(),
        }),
      );
      res.type("html").send(html);
    } catch (err) {
      next(err);
    }
  });
};
