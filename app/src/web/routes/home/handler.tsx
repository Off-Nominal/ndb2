import { Router } from "express";
import * as API from "@offnominal/ndb2-api-types/v2";
import seasons from "@data/queries/seasons";
import { getDbClient } from "@data/db/getDbClient";
import { getMemberProfile } from "@domain/discord";
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

      const dbClient = await getDbClient(res);
      let season: API.Entities.Seasons.SeasonDetail | null = null;
      const currentSeasonId = await seasons.getSeasonIdByIdentifier(dbClient)(
        "current",
      );
      if (currentSeasonId !== null) {
        season = await seasons.getById(dbClient)(currentSeasonId);
      }

      const discordProfile = await getMemberProfile(auth.discordId);

      const html = await Promise.resolve(
        <AuthenticatedPageLayout
          theme={getThemePreference()}
          colorScheme={getColorScheme()}
          title="NDB2"
          auth={auth}
          discordProfile={discordProfile}
          csrfMetaToken={auth.csrfToken}
          hxHeaders={csrfHeadersJson}
        >
          <HomePage discordProfile={discordProfile} season={season} />
        </AuthenticatedPageLayout>,
      );
      res.type("html").send(html);
    }),
  );

};
