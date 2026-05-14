import { z } from "zod";
import { queryParamScalar } from "@shared/validation/http";
import { discordIdSchema } from "@shared/validation/domain";
import {
  predictionSearchCreatorDistinctFromUnbetter,
  predictionSearchQueryCreatorSchema,
  predictionSearchQueryIncludeNonSeasonApplicableSchema,
  predictionSearchQueryKeywordSchema,
  predictionSearchQueryPageSchema,
  predictionSearchQueryPageSizeSchema,
  predictionSearchQuerySeasonIdSchema,
  predictionSearchQuerySortBySchema,
  predictionSearchQueryStatusSchema,
  predictionSearchQueryUnbetterSchema,
  PREDICTION_SEARCH_CREATOR_UNBETTER_DISTINCT_MESSAGE,
} from "@domain/predictions/prediction-search-query-fields";

/**
 * HTML **`GET /predictions`** browse query (prediction search field schemas plus `unbetter_id`).
 *
 * **Additional wire key:** **`unbetter_id`** (preferred in the location bar); **`unbetter`**
 * remains an alias matching v2 / `GET_Search.toURLSearchParams` in `@offnominal/ndb2-api-types`.
 *
 * **Defaults** (`sort_by`, `page`, `page_size`, empty `status` ⇒ no filter) apply after validation —
 * unlike v2 **`GET /predictions/search`**, an empty query string is valid.
 */
export const predictionBrowseQuerySchema = z
  .object({
    status: predictionSearchQueryStatusSchema,
    sort_by: predictionSearchQuerySortBySchema,
    keyword: predictionSearchQueryKeywordSchema,
    creator: predictionSearchQueryCreatorSchema,
    unbetter: predictionSearchQueryUnbetterSchema,
    season_id: predictionSearchQuerySeasonIdSchema,
    include_non_season_applicable:
      predictionSearchQueryIncludeNonSeasonApplicableSchema,
    page: predictionSearchQueryPageSchema,
    page_size: predictionSearchQueryPageSizeSchema,
    unbetter_id: queryParamScalar(discordIdSchema.optional()),
  })
  .superRefine((raw, ctx) => {
    if (
      raw.unbetter_id !== undefined &&
      raw.unbetter !== undefined &&
      raw.unbetter_id !== raw.unbetter
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Query parameters unbetter_id and unbetter disagree; include only one.",
        path: ["unbetter_id"],
      });
    }
  })
  .transform((raw) => ({
    status: raw.status ?? [],
    sort_by: raw.sort_by ?? "due_date-asc",
    keyword: raw.keyword,
    creator: raw.creator,
    unbetter: raw.unbetter_id ?? raw.unbetter,
    season_id: raw.season_id,
    include_non_season_applicable:
      raw.include_non_season_applicable ?? false,
    page: raw.page ?? 1,
    page_size: raw.page_size ?? 10,
  }))
  .refine(predictionSearchCreatorDistinctFromUnbetter, {
    message: PREDICTION_SEARCH_CREATOR_UNBETTER_DISTINCT_MESSAGE,
  });

export type PredictionBrowseQuery = z.infer<typeof predictionBrowseQuerySchema>;

/** Parses Express **`req.query`** (or any compatible record) for prediction browse. */
export function parsePredictionBrowseQuery(query: unknown) {
  return predictionBrowseQuerySchema.safeParse(query);
}
