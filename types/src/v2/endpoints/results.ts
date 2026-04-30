import { Entities } from "..";
import { APIResponse } from "../utils";

/** `sort_by` for cross-user lists: GET /results/all-time and GET /results/seasons/:seasonId. */
export const CROSS_SCOPE_RESULTS_SORT_VALUES = [
  "points_net-desc",
  "points_net-asc",
  "predictions_successful-desc",
  "predictions_successful-asc",
  "bets_successful-desc",
  "bets_successful-asc",
] as const;

export type CrossScopeResultsSortBy =
  (typeof CROSS_SCOPE_RESULTS_SORT_VALUES)[number];

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
