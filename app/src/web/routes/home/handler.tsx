import { Router } from "express";
import { Route } from "@shared/routerMap";
import { getWebAuth } from "../../middleware/auth/session";
import { requireWebAuth } from "../../middleware/auth/require-auth";
import { getColorScheme, getThemePreference } from "../../middleware/theme-preference";
import { wrapWebRouteWithErrorBoundary } from "../../middleware/error-boundary";
import { AuthenticatedPageLayout } from "../../shared/components/page-layout";
import { HomePage } from "./page";

/** Registers `/` and HTMX-targeted `GET /home/lucky-number`. */
export const Home: Route = (router: Router) => {
  router.get(
    "/",
    requireWebAuth,
    wrapWebRouteWithErrorBoundary(async (req, res, next) => {
      const auth = getWebAuth();
      if (auth.status !== "authenticated") {
        next(new Error("Home route reached without a session (requireWebAuth bug)"));
        return;
      }
      const csrfHeadersJson = JSON.stringify({ "X-CSRF-Token": auth.csrfToken });
      const html = await Promise.resolve(
        <AuthenticatedPageLayout
          theme={getThemePreference()}
          colorScheme={getColorScheme()}
          title="NDB2"
          auth={auth}
          csrfMetaToken={auth.csrfToken}
          hxHeaders={csrfHeadersJson}
        >
          <HomePage auth={auth} />
        </AuthenticatedPageLayout>,
      );
      res.type("html").send(html);
    }),
  );

};
