import { Router } from "express";
import { Route } from "@shared/routerMap";
import { safeReturnTo } from "../../auth/safeReturnTo";
import { getWebAuth } from "../../middleware/auth/session";
import { getColorScheme, getThemePreference } from "../../middleware/theme-preference";
import { wrapWebRouteWithErrorBoundary } from "../../middleware/error-boundary";
import { PageLayout } from "../../shared/components/page-layout";
import { LoginPage } from "./page";

/** Public `GET /login` with explicit control to start Discord OAuth. */
export const Login: Route = (router: Router) => {
  router.get(
    "/login",
    wrapWebRouteWithErrorBoundary(async (req, res, next) => {
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
        <PageLayout theme={getThemePreference()} colorScheme={getColorScheme()} title="Sign in">
          <LoginPage returnTo={returnTo} />
        </PageLayout>,
      );
      res.type("html").send(html);
    }),
  );
};
