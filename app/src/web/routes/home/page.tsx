import type { DiscordMemberProfile } from "@domain/discord";
import { HeadingScreenElement } from "@web/shared/components/heading-screen-element";
import { HomePerformanceCard } from "./components/home-performance-card";
import { LeaderboardTable, type HomePageLeaderboard } from "./components/leaderboard-table";
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

export interface HomePageProps {
  discordProfile: DiscordMemberProfile;
  season: HomePageSeasonSnapshot | null;
  leaderboard: HomePageLeaderboard | null;
  sortBy: HomeLeaderboardSortBy;
}

/** Body content for `/`; document shell is assembled in the home route handler (`handler.tsx`). */
export function HomePage(props: HomePageProps): JSX.Element {
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

      <LeaderboardTable sortBy={props.sortBy} leaderboard={props.leaderboard} />
    </div>
  );
}
