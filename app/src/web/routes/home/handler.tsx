import { Router } from "express";
import type { PoolClient } from "pg";
import * as API from "@offnominal/ndb2-api-types/v2";
import seasons from "@data/queries/seasons";
import resultsQueries, {
  RESULTS_DEFAULT_PER_PAGE,
} from "@data/queries/results";
import { getDbClient } from "@data/db/getDbClient";
import {
  getDiscordGatewayClient,
  getMemberProfile,
  getMemberProfilesGuildOnly,
  resolveUserProfileFallback,
} from "@domain/discord";
import { Route } from "@shared/routerMap";
import { getWebAuth } from "../../middleware/auth/session";
import { requireWebAuth } from "../../middleware/auth/require-auth";
import { getColorScheme, getThemePreference } from "../../middleware/theme-preference";
import { wrapWebRouteWithErrorBoundary } from "../../middleware/error-boundary";
import { AuthenticatedPageLayout } from "../../shared/components/page-layout";
import type { HomePageLeaderboard } from "./components/leaderboard-table";
import {
  LeaderboardPlayerChip,
  LeaderboardTable,
} from "./components/leaderboard-table";
import { HomePage } from "./page";
import {
  HOME_LEADERBOARD_HTMX_PATH,
  HOME_LEADERBOARD_PLAYER_IDENTITY_PATH,
  parseHomeLeaderboardPlayerIdentityQuery,
  parseHomeLeaderboardSortFromQuery,
  type HomeLeaderboardSortBy,
} from "./leaderboard-sort.js";

async function loadHomePageLeaderboardForSeasonId(
  dbClient: PoolClient,
  seasonId: number,
  sortBy: HomeLeaderboardSortBy,
): Promise<HomePageLeaderboard> {
  const { meta, results: leaderboardRows } =
    await resultsQueries.getSeasonLeaderboard(dbClient)({
      season_id: seasonId,
      sort_by: sortBy,
      page: 1,
      per_page: RESULTS_DEFAULT_PER_PAGE,
    });
  const profileByDiscord = await getMemberProfilesGuildOnly(
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
        needsDeferredProfile: profile == null,
        predictions: row.predictions,
        bets: row.bets,
        points: row.points,
      };
    }),
  };
}

async function loadHomePageLeaderboard(
  dbClient: PoolClient,
  currentSeasonId: number | null,
  sortBy: HomeLeaderboardSortBy,
): Promise<HomePageLeaderboard | null> {
  if (currentSeasonId === null) {
    return null;
  }
  return loadHomePageLeaderboardForSeasonId(dbClient, currentSeasonId, sortBy);
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
        currentSeasonId === null
          ? null
          : await loadHomePageLeaderboardForSeasonId(
              dbClient,
              currentSeasonId,
              sortBy,
            );

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

  router.get(
    HOME_LEADERBOARD_PLAYER_IDENTITY_PATH,
    requireWebAuth,
    wrapWebRouteWithErrorBoundary(async (req, res, next) => {
      const auth = getWebAuth();
      if (auth.status !== "authenticated") {
        next(new Error("Home leaderboard player identity reached without a session"));
        return;
      }

      const parsed = parseHomeLeaderboardPlayerIdentityQuery(req.query);
      if (!parsed.success) {
        res.status(400).type("text").send("Invalid discord_id query parameter");
        return;
      }

      const profile = await resolveUserProfileFallback(
        getDiscordGatewayClient(),
        parsed.data.discord_id,
      );
      const html = await Promise.resolve(
        <LeaderboardPlayerChip
          discordId={parsed.data.discord_id}
          displayName={profile?.displayName ?? "Unknown member"}
          avatarUrl={profile?.avatarUrl ?? null}
        />,
      );
      res.type("html").send(html);
    }),
  );
};
