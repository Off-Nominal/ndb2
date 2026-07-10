import { Router } from "express";
<<<<<<< HEAD
import { getDbClient } from "@data/db/getDbClient";
import seasons from "@data/queries/seasons";
import {
  getDiscordGatewayClient,
  getMemberProfile,
  listPortalGuildCachedMemberProfiles,
  resolveUserProfileFallback,
  type PortalGuildCachedMemberProfile,
} from "@domain/discord";
=======
import { getDiscordGatewayStatus } from "@domain/discord";
>>>>>>> main
import { Route } from "@shared/routerMap";
import { resolveAuthenticatedShell } from "../../auth/resolve-authenticated-shell";
import { getWebAuth } from "../../middleware/auth/session";
import { requireWebAuth } from "../../middleware/auth/require-auth";
import { getColorScheme, getThemePreference } from "../../middleware/theme-preference";
import { wrapWebRouteWithErrorBoundary } from "../../middleware/error-boundary";
import { AuthenticatedPageLayout } from "../../shared/components/page-layout";
import { clientScriptsForRouteDir } from "../../generated/routeClientScripts";
import { documentTitle } from "@web/shared/utils/document_title";
import { buildPredictionPredictorSelectOptions } from "./build-predictor-select-options";
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

<<<<<<< HEAD
      const browseParsed = parsePredictionBrowseQuery(req.query);
      const browseQuery = browseParsed.success
        ? browseParsed.data
        : PREDICTION_BROWSE_DEFAULT_QUERY;

      const discordProfile = await getMemberProfile(auth.discordId);
=======
      const { discordProfile, showAdminNav } = await resolveAuthenticatedShell(auth);
>>>>>>> main
      const csrfHeadersJson = JSON.stringify({ "X-CSRF-Token": auth.csrfToken });

      const dbClient = await getDbClient(res);
      const [seasonRows, memberProfiles] = await Promise.all([
        seasons.getAll(dbClient)(),
        listPortalGuildCachedMemberProfiles(),
      ]);
      const seasonOptions = buildPredictionSeasonSelectOptions(seasonRows);

      const predictorDiscordId = browseQuery.predictor;
      let predictorFallback: PortalGuildCachedMemberProfile | undefined;
      if (
        predictorDiscordId !== undefined &&
        !memberProfiles.some((m) => m.discordId === predictorDiscordId)
      ) {
        const client = getDiscordGatewayClient();
        const profile = await resolveUserProfileFallback(client, predictorDiscordId);
        if (profile) {
          predictorFallback = {
            discordId: predictorDiscordId,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
          };
        }
      }

      const predictorOptions = buildPredictionPredictorSelectOptions(
        memberProfiles,
        predictorDiscordId,
        predictorFallback,
      );

      const html = await Promise.resolve(
        <AuthenticatedPageLayout
          theme={getThemePreference()}
          colorScheme={getColorScheme()}
          title={documentTitle("Predictions")}
          auth={auth}
          discordProfile={discordProfile}
          showAdminNav={showAdminNav}
          discordGatewayStatus={getDiscordGatewayStatus()}
          csrfMetaToken={auth.csrfToken}
          hxHeaders={csrfHeadersJson}
          clientScripts={clientScriptsForRouteDir("predictions")}
        >
          <PredictionsPage
            browseQuery={browseQuery}
            viewerDiscordId={auth.discordId}
            seasonOptions={seasonOptions}
            predictorOptions={predictorOptions}
          />
        </AuthenticatedPageLayout>,
      );

      res.type("html").send(html);
    }),
  );
};
