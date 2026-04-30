import { Entities } from "..";
import { APIResponse } from "../utils";

/** Combined wire format for `sort_by` on GET /users/discord_id/:discord_id/results. */
export const USER_SEASONS_RESULTS_SORT_VALUES = [
  "season_end-desc",
  "season_end-asc",
] as const;

export type UserSeasonsResultsSortBy =
  (typeof USER_SEASONS_RESULTS_SORT_VALUES)[number];

// GET /users/discord_id/:discord_id/results
export namespace GET_ByDiscordId_results {
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
export namespace GET_ByDiscordId_results_all_time {
  export type Params = {
    discord_id: string;
  };

  export type Data = Entities.Results.UserSeasonResult;
  export type Response = APIResponse<Data>;
}
