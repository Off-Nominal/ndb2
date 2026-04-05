import { Entities } from "..";
import { PredictionDriver } from "../entities/predictions";
import { APIResponse } from "../utils";

// GET /predictions/{prediction_id}/
export namespace GET_ById {
  export type Data = Entities.Predictions.Prediction;
  export type Response = APIResponse<Data>;
}

// DELETE /predictions/{prediction_id}/trigger
export namespace DELETE_ById_trigger {
  export type Data = Entities.Predictions.Prediction;
  export type Response = APIResponse<Data>;
}

// PATCH /predictions/{prediction_id}/retire
export namespace PATCH_ById_retire {
  export type Body = {
    discord_id: string;
  };
  export type Data = Entities.Predictions.Prediction;
  export type Response = APIResponse<Data>;
}

// GET /predictions/search
export namespace GET_Search {
  export const SORT_BY_VALUES = [
    "created_date-asc",
    "created_date-desc",
    "due_date-asc",
    "due_date-desc",
    "check_date-asc",
    "check_date-desc",
    "retired_date-asc",
    "retired_date-desc",
    "triggered_date-asc",
    "triggered_date-desc",
    "closed_date-asc",
    "closed_date-desc",
    "judged_date-asc",
    "judged_date-desc",
  ] as const;

  export type SortByOption = (typeof SORT_BY_VALUES)[number];

  /** Strongly typed search inputs (before encoding for the wire). */
  type SearchQueryFields = {
    /** One status or several (e.g. repeated `status` query params). */
    status:
      | Entities.Predictions.PredictionLifeCycle
      | Entities.Predictions.PredictionLifeCycle[];
    sort_by: SortByOption;
    /** Free-text search; API enforces max length 500. */
    keyword: string;
    creator: string;
    unbetter: string;
    season_id: number;
    include_non_season_applicable: boolean;
    /** 1-based page index (maps to `page` query param as a string on the wire). */
    page: number;
  };

  export type QueryKey = keyof SearchQueryFields;

  /**
   * Client-side shape for GET /predictions/search.
   * Serialize with {@link toURLSearchParams} (handles repeated `status` and string coercion).
   */
  export type Query = Partial<SearchQueryFields>;

  /**
   * Builds `application/x-www-form-urlencoded` query params for this route.
   * Uses `append` for `status` (repeated keys) and `set` for scalar keys.
   */
  export function toURLSearchParams(query: Query): URLSearchParams {
    const params = new URLSearchParams();

    if (query.status !== undefined) {
      const statuses = Array.isArray(query.status)
        ? query.status
        : [query.status];
      for (const s of statuses) {
        params.append("status", s);
      }
    }

    if (query.sort_by !== undefined) {
      params.set("sort_by", query.sort_by);
    }
    if (query.keyword !== undefined) {
      params.set("keyword", query.keyword);
    }
    if (query.creator !== undefined) {
      params.set("creator", query.creator);
    }
    if (query.unbetter !== undefined) {
      params.set("unbetter", query.unbetter);
    }
    if (query.season_id !== undefined) {
      params.set("season_id", String(query.season_id));
    }
    if (query.include_non_season_applicable !== undefined) {
      params.set(
        "include_non_season_applicable",
        query.include_non_season_applicable ? "true" : "false",
      );
    }
    if (query.page !== undefined) {
      params.set("page", String(query.page));
    }

    return params;
  }

  export type Data = Entities.Predictions.PredictionSearchResult[];
  export type Response = APIResponse<Data>;
}

// POST /predictions - Add New Prediction
export namespace POST_Predictions {
  export type Body = {
    text: string;
    discord_id: string;
    date: string | Date;
    driver: PredictionDriver;
  };

  export type Data = Entities.Predictions.Prediction;
  export type Response = APIResponse<Data>;
}

// POST /predictions/{prediction_id}/bets
export namespace POST_ById_bets {
  export type Body = {
    discord_id: string;
    endorsed: boolean;
  };
  export type Data = Entities.Predictions.Prediction;
  export type Response = APIResponse<Data>;
}

// POST /predictions/{prediction_id}/votes
export namespace POST_ById_votes {
  export type Body = {
    discord_id: string;
    vote: boolean;
  };
  export type Data = Entities.Predictions.Prediction;
  export type Response = APIResponse<Data>;
}

// PATCH /predictions/{prediction_id}/snooze
export namespace PATCH_ById_snooze {
  export type Body = {
    discord_id: string;
    /** ISO 8601 datetime; must be in the future and after the prediction’s `created_date`. */
    check_date: string;
  };
  export type Data = Entities.Predictions.Prediction;
  export type Response = APIResponse<Data>;
}

// POST /predictions/{prediction_id}/snooze_checks/{snooze_check_id}
export namespace POST_ById_snooze_checks {
  export type Body = {
    discord_id: string;
    /** Snooze duration in days; see {@link Entities.SnoozeVotes.SnoozeVoteValue}. */
    value: Entities.SnoozeVotes.SnoozeVoteValue;
  };
  export type Data = Entities.Predictions.Prediction;
  export type Response = APIResponse<Data>;
}
