import { Router } from "express";
import { getDbClient } from "@data/db/getDbClient";
import seasons from "@data/queries/seasons";
import { getMemberProfile } from "@domain/discord";
import { Route } from "@shared/routerMap";
import { getWebAuth } from "../../middleware/auth/session";
import { requireWebAuth } from "../../middleware/auth/require-auth";
import { getColorScheme, getThemePreference } from "../../middleware/theme-preference";
import { wrapWebRouteWithErrorBoundary } from "../../middleware/error-boundary";
import { AuthenticatedPageLayout } from "../../shared/components/page-layout";
import { clientScriptsForRouteDir } from "../../generated/routeClientScripts";
import { documentTitle } from "@web/shared/utils/document_title";
import { buildPredictionSeasonSelectOptions } from "./build-season-select-options";
import {
  parsePredictionBrowseQuery,
  PREDICTION_BROWSE_DEFAULT_QUERY,
} from "./parse-prediction-browse-query";
import { PredictionsPage } from "./page";

/** Registers **`GET /predictions`** (authenticated shell + browse scaffold). */
export const Predictions: Route = (router: Router) => {
  router.get(
    "/predictions",
    requireWebAuth,
    wrapWebRouteWithErrorBoundary(async (req, res, next) => {
      const auth = getWebAuth();
      if (auth.status !== "authenticated") {
        next(new Error("Predictions route reached without a session"));
        return;
      }

      const browseParsed = parsePredictionBrowseQuery(req.query);
      const browseQuery = browseParsed.success
        ? browseParsed.data
        : PREDICTION_BROWSE_DEFAULT_QUERY;

      const discordProfile = await getMemberProfile(auth.discordId);
      const csrfHeadersJson = JSON.stringify({ "X-CSRF-Token": auth.csrfToken });

      const dbClient = await getDbClient(res);
      const seasonRows = await seasons.getAll(dbClient)();
      const seasonOptions = buildPredictionSeasonSelectOptions(seasonRows);

      const html = await Promise.resolve(
        <AuthenticatedPageLayout
          theme={getThemePreference()}
          colorScheme={getColorScheme()}
          title={documentTitle("Predictions")}
          auth={auth}
          discordProfile={discordProfile}
          csrfMetaToken={auth.csrfToken}
          hxHeaders={csrfHeadersJson}
          clientScripts={clientScriptsForRouteDir("predictions")}
        >
          <PredictionsPage
            browseQuery={browseQuery}
            viewerDiscordId={auth.discordId}
            seasonOptions={seasonOptions}
          />
        </AuthenticatedPageLayout>,
      );

      res.type("html").send(html);
    }),
  );
};
