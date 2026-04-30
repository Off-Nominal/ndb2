import { Entities } from "..";
import { APIResponse } from "../utils";

// GET /seasons/
export namespace GET {
  export type Data = Entities.Seasons.Season[];
  export type Response = APIResponse<Data>;
}

// GET /seasons/:id (positive integer id or current | past | future)
export namespace GET_ById {
  export type Data = Entities.Seasons.SeasonDetail;
  export type Response = APIResponse<Data>;
}

/** Combined wire format for `sort_by` on GET /seasons/:id/results (matches predictions `sort_by` style). */
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
export namespace GET_ById_results {
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
export namespace GET_ById_users_ByDiscordId_result {
  export type Params = {
    season_id: number;
    discord_id: string;
  };

  export type Data = Entities.Results.UserSeasonResult;
  export type Response = APIResponse<Data>;
}
