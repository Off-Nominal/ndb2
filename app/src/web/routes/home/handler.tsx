import { Router } from "express";
import type { PoolClient } from "pg";
import seasons from "@data/queries/seasons";
import resultsQueries, {
  RESULTS_DEFAULT_PER_PAGE,
} from "@data/queries/results";
import { getDbClient } from "@data/db/getDbClient";
import {
  getDiscordGatewayClient,
  getMemberProfile,
  getMemberProfilesGuildOnly,
  memberProfileFromDiscordUsersCache,
  prefetchUserProfileFallback,
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
import {
  HomePerformanceCard,
  type HomePerformanceCardPerformance,
} from "./components/home-performance-card";
import { SeasonCard } from "./components/season-card";
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
  const discordClient = getDiscordGatewayClient();
  const prefetchStartedForDiscordId = new Set<string>();

  return {
    meta,
    rows: leaderboardRows.map((row) => {
      const discordId = row.user.discord_id;
      let profile = profileByDiscord.get(discordId) ?? null;
      let needsDeferredProfile = profile === null;

      if (needsDeferredProfile) {
        const fromUsersCache = memberProfileFromDiscordUsersCache(discordClient, discordId);
        if (fromUsersCache) {
          profile = fromUsersCache;
          needsDeferredProfile = false;
        } else if (!prefetchStartedForDiscordId.has(discordId)) {
          prefetchStartedForDiscordId.add(discordId);
          prefetchUserProfileFallback(discordClient, discordId);
        }
      }

      return {
        discordId,
        displayName: profile?.displayName ?? "Unknown member",
        avatarUrl: profile?.avatarUrl ?? null,
        needsDeferredProfile,
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
      const currentSeasonId = await seasons.getSeasonIdByIdentifier(dbClient)(
        "current",
      );
      if (currentSeasonId === null) {
        next(
          new Error(
            "Invariant violation: expected a current season; home route cannot render without one.",
          ),
        );
        return;
      }

      const season = await seasons.getById(dbClient)(currentSeasonId);
      if (season === null) {
        next(
          new Error(
            `Invariant violation: current season id ${currentSeasonId} returned no row from getById.`,
          ),
        );
        return;
      }

      const leaderboardPromise = loadHomePageLeaderboardForSeasonId(
        dbClient,
        currentSeasonId,
        sortBy,
      );
      const userSeasonResultPromise = resultsQueries.getSeasonResultForUser(
        dbClient,
      )(currentSeasonId, auth.userId);

      const [leaderboard, userSeasonResult] = await Promise.all([
        leaderboardPromise,
        userSeasonResultPromise,
      ]);

      let performance: HomePerformanceCardPerformance;

      if (userSeasonResult === null) {
        performance = {
          state: "no-activity",
          participantCount: leaderboard.meta.total_count,
        };
      } else {
        performance = {
          state: "ready",
          data: userSeasonResult
        };
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
          <HomePage>
            <>
              <div class="[ home-grid ]">
                <SeasonCard
                  name={season.name}
                  predictions={season.predictions}
                  startDate={season.start}
                  endDate={season.end}
                />
                <HomePerformanceCard
                  discordProfile={discordProfile}
                  discordUserId={auth.discordId}
                  performance={performance}
                />
              </div>
              <LeaderboardTable sortBy={sortBy} leaderboard={leaderboard} />
            </>
          </HomePage>
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
      if (currentSeasonId === null) {
        next(
          new Error(
            "Invariant violation: expected a current season; home leaderboard fragment cannot render without one.",
          ),
        );
        return;
      }

      const leaderboard = await loadHomePageLeaderboardForSeasonId(
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
