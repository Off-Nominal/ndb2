import { Entities } from "..";
import { APIResponse } from "../utils";

/**
 * Sortable leaderboard columns (season + all-time). Query params are
 * `<column>-desc` or `<column>-asc` except ranks: for `rank_*` columns,
 * `-desc` means best rank first (rank 1 at the top), `-asc` means worst first.
 */
export const CROSS_SCOPE_LEADERBOARD_SORT_COLUMNS = [
  "predictions_successful",
  "predictions_failed",
  "predictions_open",
  "predictions_closed",
  "predictions_checking",
  "predictions_retired",
  "bets_successful",
  "bets_failed",
  "bets_pending",
  "bets_retired",
  "bets_invalid",
  "votes_yes",
  "votes_no",
  "votes_affirmative",
  "votes_negative",
  "votes_pending",
  "points_rewards",
  "points_penalties",
  "points_net",
  "rank_points_net",
  "rank_predictions_successful",
  "rank_bets_successful",
] as const;

export type CrossScopeLeaderboardSortColumn =
  (typeof CROSS_SCOPE_LEADERBOARD_SORT_COLUMNS)[number];

export type CrossScopeResultsSortBy =
  | `${CrossScopeLeaderboardSortColumn}-desc`
  | `${CrossScopeLeaderboardSortColumn}-asc`;

function crossScopeResultsSortValues(): [
  CrossScopeResultsSortBy,
  ...CrossScopeResultsSortBy[],
] {
  return CROSS_SCOPE_LEADERBOARD_SORT_COLUMNS.flatMap((c) => [
    `${c}-desc`,
    `${c}-asc`,
  ]) as [CrossScopeResultsSortBy, ...CrossScopeResultsSortBy[]];
}

/** `sort_by` for cross-user lists: GET /results/all-time and GET /results/seasons/:seasonId. */
export const CROSS_SCOPE_RESULTS_SORT_VALUES = crossScopeResultsSortValues();

/** `sort_by` for GET /results/users/discord_id/:discord_id/seasons. */
export const USER_SEASONS_SCOPE_SORT_VALUES = [
  "season_end-desc",
  "season_end-asc",
] as const;

export type UserSeasonsScopeSortBy =
  (typeof USER_SEASONS_SCOPE_SORT_VALUES)[number];

// GET /results/all-time
export namespace GET_all_time {
  export type Query = {
    /** Omitted query param defaults to `rank_points_net-desc` (best net-points rank first). */
    sort_by: CrossScopeResultsSortBy;
    page: number;
    per_page: number;
  };

  export type Data = {
    meta: Entities.Results.PaginatedMeta;
    results: Entities.Results.UserSeasonLeaderboardRow[];
  };
  export type Response = APIResponse<Data>;
}

// GET /results/seasons/:seasonId (seasonId: numeric id or current | last)
export namespace GET_seasons_BySeasonId {
  export type Params = {
    /** Resolved DB season id after path lookup. */
    season_id: number;
  };

  export type Query = {
    /** Omitted query param defaults to `rank_points_net-desc` (best net-points rank first). */
    sort_by: CrossScopeResultsSortBy;
    page: number;
    per_page: number;
  };

  export type Data = {
    meta: Entities.Results.PaginatedMeta;
    results: Entities.Results.UserSeasonLeaderboardRow[];
  };
  export type Response = APIResponse<Data>;
}

// GET /results/seasons/:seasonId/users/discord_id/:discord_id
export namespace GET_seasons_BySeasonId_users_ByDiscordId {
  export type Params = {
    season_id: number;
    discord_id: string;
  };

  export type Data = Entities.Results.UserSeasonResult;
  export type Response = APIResponse<Data>;
}

// GET /results/users/discord_id/:discord_id/seasons
export namespace GET_users_ByDiscordId_seasons {
  export type Params = {
    discord_id: string;
  };

  export type Query = {
    sort_by: UserSeasonsScopeSortBy;
    page: number;
    per_page: number;
  };

  export type Data = {
    meta: Entities.Results.PaginatedMeta;
    results: Entities.Results.UserSeasonResultRow[];
  };
  export type Response = APIResponse<Data>;
}

// GET /results/users/discord_id/:discord_id/all-time
export namespace GET_users_ByDiscordId_all_time {
  export type Params = {
    discord_id: string;
  };

  export type Data = Entities.Results.UserSeasonResult;
  export type Response = APIResponse<Data>;
}
