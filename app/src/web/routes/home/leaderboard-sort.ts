import { z } from "zod";
import {
  discordIdSchema,
  queryParamScalar,
} from "../../../api/v2/validations/index.js";
import { Endpoints } from "@offnominal/ndb2-api-types/v2";

const homeLeaderboardSortSchema = z.object({
  sort_by: queryParamScalar(
    z
      .enum(Endpoints.Results.CROSS_SCOPE_RESULTS_SORT_VALUES)
      .optional()
      .default("rank_points_net-desc"),
  ),
});

/** HTMX partial for the leaderboard table (`GET /home/leaderboard`); keep in sync with `Home` route registration. */
export const HOME_LEADERBOARD_HTMX_PATH = "/home/leaderboard";

/** HTMX fragment for leaderboard player avatar + display name hydration. */
export const HOME_LEADERBOARD_PLAYER_IDENTITY_PATH = "/home/leaderboard/player-identity";

const homeLeaderboardPlayerIdentitySchema = z.object({
  discord_id: queryParamScalar(discordIdSchema),
});

export type HomeLeaderboardSortBy = Endpoints.Results.CrossScopeResultsSortBy;

export function parseHomeLeaderboardSortFromQuery(
  query: unknown,
): HomeLeaderboardSortBy {
  const parsed = homeLeaderboardSortSchema.safeParse(query);
  if (!parsed.success) return "rank_points_net-desc";
  return parsed.data.sort_by;
}

export function homeLeaderboardFragmentUrl(
  sortBy: HomeLeaderboardSortBy,
): string {
  const q = new URLSearchParams({ sort_by: sortBy });
  return `${HOME_LEADERBOARD_HTMX_PATH}?${q.toString()}`;
}

/** Strict parse for `/home/leaderboard/player-identity` query validation. */
export function parseHomeLeaderboardPlayerIdentityQuery(query: unknown) {
  return homeLeaderboardPlayerIdentitySchema.safeParse(query);
}

export function homeLeaderboardPlayerIdentityUrl(discordId: string): string {
  const q = new URLSearchParams({ discord_id: discordId });
  return `${HOME_LEADERBOARD_PLAYER_IDENTITY_PATH}?${q.toString()}`;
}

export function homeLeaderboardPageUrl(sortBy: HomeLeaderboardSortBy): string {
  const q = new URLSearchParams({ sort_by: sortBy });
  return `/?${q.toString()}`;
}
