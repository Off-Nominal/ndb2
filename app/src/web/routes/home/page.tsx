import type { DiscordMemberProfile } from "@domain/discord";
import { Suspense } from "@kitajs/html/suspense";
import { HeadingScreenElement } from "@web/shared/components/heading-screen-element";
import { HomePerformanceCard } from "./components/home-performance-card";
import {
  LeaderboardTable,
  HomeLeaderboardStreamErrorFallback,
  HomeLeaderboardStreamFallback,
  type HomePageLeaderboard,
} from "./components/leaderboard-table";
import { SeasonCard } from "./components/season-card";
import type { HomeLeaderboardSortBy } from "./leaderboard-sort.js";

export type {
  HomePageLeaderboard,
  HomePageLeaderboardBets,
  HomePageLeaderboardMeta,
  HomePageLeaderboardPoints,
  HomePageLeaderboardPredictions,
  HomePageLeaderboardRow,
} from "./components/leaderboard-table";

/** Prediction buckets shown on the home season card — duplicated shape for decoupling from API/types. */
export interface HomePageSeasonPredictionCounts {
  open: number;
  checking: number;
  closed: number;
  successful: number;
  failed: number;
  retired: number;
}

/** Season snapshot passed into the main menu (decoupled from domain entities). */
export interface HomePageSeasonSnapshot {
  name: string;
  predictions: HomePageSeasonPredictionCounts;
  start: string;
  end: string;
}

/** Static snapshot for SSR, or a promise resolved under {@link Suspense} for streamed first paint. */
export type HomePageLeaderboardState =
  | { kind: "static"; leaderboard: HomePageLeaderboard | null }
  | { kind: "stream"; load: Promise<HomePageLeaderboard> };

export interface HomePageProps {
  discordProfile: DiscordMemberProfile;
  season: HomePageSeasonSnapshot | null;
  leaderboard: HomePageLeaderboardState;
  sortBy: HomeLeaderboardSortBy;
  /** Shared request id from `renderToStream((rid) => …)` when any `Suspense` boundary is present. */
  suspenseRid: number | string;
}

/** Body content for `/` (Kitajs HTML JSX → string/stream); document shell is {@link AuthenticatedPageLayout} in the handler. */
export function HomePage(props: HomePageProps): JSX.Element {
  const leaderboardBlock =
    props.leaderboard.kind === "static" ? (
      <LeaderboardTable
        leaderboard={props.leaderboard.leaderboard}
        sortBy={props.sortBy}
      />
    ) : (
      <Suspense
        rid={props.suspenseRid}
        fallback={<HomeLeaderboardStreamFallback />}
        catch={() => <HomeLeaderboardStreamErrorFallback />}
      >
        {props.leaderboard.load.then((leaderboard: HomePageLeaderboard) => (
          <LeaderboardTable leaderboard={leaderboard} sortBy={props.sortBy} />
        ))}
      </Suspense>
    );

  return (
    <div class="[ stack ] [ main-menu ]">
      <HeadingScreenElement>
        <h1 class="[ canvas-knockout-text ]">Main Menu</h1>
      </HeadingScreenElement>

      <div class="[ home-grid ]">
        <SeasonCard
          name={props.season?.name ?? ""}
          predictions={props.season?.predictions ?? null}
          startDate={props.season?.start ?? ""}
          endDate={props.season?.end ?? ""}
        />
        <HomePerformanceCard discordProfile={props.discordProfile} />
      </div>

      {leaderboardBlock}
    </div>
  );
}
