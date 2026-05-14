import { Router } from "express";
import { getMemberProfile } from "@domain/discord";
import { Route } from "@shared/routerMap";
import { getWebAuth } from "../../middleware/auth/session";
import { requireWebAuth } from "../../middleware/auth/require-auth";
import { getColorScheme, getThemePreference } from "../../middleware/theme-preference";
import { wrapWebRouteWithErrorBoundary } from "../../middleware/error-boundary";
import { AuthenticatedPageLayout } from "../../shared/components/page-layout";
import { PredictionsPage } from "./page";

/** Registers **`GET /predictions`** (authenticated shell + browse scaffold). */
export const Predictions: Route = (router: Router) => {
  router.get(
    "/predictions",
    requireWebAuth,
    wrapWebRouteWithErrorBoundary(async (_req, res, next) => {
      const auth = getWebAuth();
      if (auth.status !== "authenticated") {
        next(new Error("Predictions route reached without a session"));
        return;
      }

      const discordProfile = await getMemberProfile(auth.discordId);
      const csrfHeadersJson = JSON.stringify({ "X-CSRF-Token": auth.csrfToken });

      const html = await Promise.resolve(
        <AuthenticatedPageLayout
          theme={getThemePreference()}
          colorScheme={getColorScheme()}
          title="Predictions · NDB2"
          auth={auth}
          discordProfile={discordProfile}
          csrfMetaToken={auth.csrfToken}
          hxHeaders={csrfHeadersJson}
        >
          <PredictionsPage />
        </AuthenticatedPageLayout>,
      );

      res.type("html").send(html);
    }),
  );
};
