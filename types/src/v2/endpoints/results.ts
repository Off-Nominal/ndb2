import type * as Entities from "../entities";
import { APIResponse } from "../utils";

/** Combined wire format for `sort` + `order` sent to SQL (matches predictions `sort_by` style). */
export const SEASON_LEADERBOARD_SORT_VALUES = [
  "points_net-desc",
  "points_net-asc",
  "predictions_successful-desc",
  "predictions_successful-asc",
  "bets_successful-desc",
  "bets_successful-asc",
] as const;

export type SeasonLeaderboardSortBy = (typeof SEASON_LEADERBOARD_SORT_VALUES)[number];

// GET /seasons/:id/results
export namespace GET_Seasons_ById_results {
  export type Params = {
    /** Path: numeric id or `current` | `past` | `future` — resolved to integer in the handler. */
    season_id: number;
  };

  export type Query = {
    sort_by: SeasonLeaderboardSortBy;
    page: number;
    per_page: number;
  };

  export type Data = {
    meta: Entities.Results.PaginatedMeta;
    results: Entities.Results.UserSeasonLeaderboardRow[];
  };
  export type Response = APIResponse<Data>;
}

// GET /seasons/:id/users/discord_id/:discord_id/result
export namespace GET_Seasons_ById_users_ByDiscordId_result {
  export type Params = {
    season_id: number;
    discord_id: string;
  };

  export type Data = Entities.Results.UserSeasonResult;
  export type Response = APIResponse<Data>;
}

export const USER_SEASONS_RESULTS_SORT_VALUES = ["season_end-desc", "season_end-asc"] as const;
export type UserSeasonsResultsSortBy = (typeof USER_SEASONS_RESULTS_SORT_VALUES)[number];

// GET /users/discord_id/:discord_id/results
export namespace GET_Users_ByDiscordId_results {
  export type Params = {
    discord_id: string;
  };

  export type Query = {
    sort_by: UserSeasonsResultsSortBy;
    page: number;
    per_page: number;
  };

  export type Data = {
    meta: Entities.Results.PaginatedMeta;
    results: Entities.Results.UserSeasonResultRow[];
  };
  export type Response = APIResponse<Data>;
}

// GET /users/discord_id/:discord_id/results/all-time
export namespace GET_Users_ByDiscordId_results_all_time {
  export type Params = {
    discord_id: string;
  };

  export type Data = Entities.Results.UserSeasonResult;
  export type Response = APIResponse<Data>;
}
