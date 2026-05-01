import { Router } from "express";
import type { PoolClient } from "pg";
import * as API from "@offnominal/ndb2-api-types/v2";
import seasons from "@data/queries/seasons";
import resultsQueries, {
  RESULTS_DEFAULT_PER_PAGE,
} from "@data/queries/results";
import { getDbClient } from "@data/db/getDbClient";
import { getMemberProfile, getMemberProfiles } from "@domain/discord";
import { Route } from "@shared/routerMap";
import { getWebAuth } from "../../middleware/auth/session";
import { requireWebAuth } from "../../middleware/auth/require-auth";
import { getColorScheme, getThemePreference } from "../../middleware/theme-preference";
import { wrapWebRouteWithErrorBoundary } from "../../middleware/error-boundary";
import { AuthenticatedPageLayout } from "../../shared/components/page-layout";
import type { HomePageLeaderboard } from "./components/leaderboard-table";
import { LeaderboardTable } from "./components/leaderboard-table";
import { HomePage } from "./page";
import {
  HOME_LEADERBOARD_HTMX_PATH,
  parseHomeLeaderboardSortFromQuery,
  type HomeLeaderboardSortBy,
} from "./leaderboard-sort.js";

async function loadHomePageLeaderboard(
  dbClient: PoolClient,
  currentSeasonId: number | null,
  sortBy: HomeLeaderboardSortBy,
): Promise<HomePageLeaderboard | null> {
  if (currentSeasonId === null) {
    return null;
  }

  const { meta, results: leaderboardRows } =
    await resultsQueries.getSeasonLeaderboard(dbClient)({
      season_id: currentSeasonId,
      sort_by: sortBy,
      page: 1,
      per_page: RESULTS_DEFAULT_PER_PAGE,
    });
  const profileByDiscord = await getMemberProfiles(
    leaderboardRows.map((row) => row.user.discord_id),
  );
  return {
    meta,
    rows: leaderboardRows.map((row) => {
      const profile = profileByDiscord.get(row.user.discord_id);
      return {
        discordId: row.user.discord_id,
        displayName: profile?.displayName ?? "Unknown member",
        avatarUrl: profile?.avatarUrl ?? null,
        predictions: row.predictions,
        bets: row.bets,
        points: row.points,
      };
    }),
  };
}

/** Registers `/`, `GET /home/leaderboard` (HTMX partial), and related home routes. */
export const Home: Route = (router: Router) => {
  const homePageHandler = wrapWebRouteWithErrorBoundary(
    async (req, res, next) => {
      const auth = getWebAuth();
      if (auth.status !== "authenticated") {
        next(new Error("Home route reached without a session (requireWebAuth bug)"));
        return;
      }
      const sortBy = parseHomeLeaderboardSortFromQuery(req.query);
      const csrfHeadersJson = JSON.stringify({ "X-CSRF-Token": auth.csrfToken });

      const dbClient = await getDbClient(res);
      let season: API.Entities.Seasons.SeasonDetail | null = null;
      const currentSeasonId = await seasons.getSeasonIdByIdentifier(dbClient)(
        "current",
      );
      if (currentSeasonId !== null) {
        season = await seasons.getById(dbClient)(currentSeasonId);
      }

      const leaderboard =
        currentSeasonId === null ? null : undefined;

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
          <HomePage
            discordProfile={discordProfile}
            sortBy={sortBy}
            season={season}
            leaderboard={leaderboard}
          />
        </AuthenticatedPageLayout>,
      );
      res.type("html").send(html);
    },
  );

  router.get("/", requireWebAuth, homePageHandler);

  router.get(
    HOME_LEADERBOARD_HTMX_PATH,
    requireWebAuth,
    wrapWebRouteWithErrorBoundary(async (req, res, next) => {
      const auth = getWebAuth();
      if (auth.status !== "authenticated") {
        next(new Error("Home leaderboard fragment reached without a session"));
        return;
      }

      const sortBy = parseHomeLeaderboardSortFromQuery(req.query);
      const dbClient = await getDbClient(res);
      const currentSeasonId = await seasons.getSeasonIdByIdentifier(dbClient)(
        "current",
      );
      const leaderboard = await loadHomePageLeaderboard(
        dbClient,
        currentSeasonId,
        sortBy,
      );

      const html = await Promise.resolve(
        <LeaderboardTable sortBy={sortBy} leaderboard={leaderboard} />,
      );
      res.type("html").send(html);
    }),
  );
};
