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

/** Browse pager defaults (aligned with {@link predictionBrowseQuerySchema} transforms + canonical URL omissions). */
export const PREDICTION_BROWSE_DEFAULT_PAGE = 1;
export const PREDICTION_BROWSE_DEFAULT_PAGE_SIZE = 10;
export const PREDICTION_BROWSE_DEFAULT_SORT_BY = "due_date-asc";

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
    sort_by: raw.sort_by ?? PREDICTION_BROWSE_DEFAULT_SORT_BY,
    keyword: raw.keyword,
    creator: raw.creator,
    unbetter: raw.unbetter_id ?? raw.unbetter,
    season_id: raw.season_id,
    include_non_season_applicable:
      raw.include_non_season_applicable ?? false,
    page: raw.page ?? PREDICTION_BROWSE_DEFAULT_PAGE,
    page_size: raw.page_size ?? PREDICTION_BROWSE_DEFAULT_PAGE_SIZE,
  }))
  .refine(predictionSearchCreatorDistinctFromUnbetter, {
    message: PREDICTION_SEARCH_CREATOR_UNBETTER_DISTINCT_MESSAGE,
  });

export type PredictionBrowseQuery = z.infer<typeof predictionBrowseQuerySchema>;

/**
 * Parsed defaults for an empty query — use when **`parsePredictionBrowseQuery`** fails so the browse UI
 * still renders with safe **`GET`** semantics.
 */
export const PREDICTION_BROWSE_DEFAULT_QUERY: PredictionBrowseQuery =
  predictionBrowseQuerySchema.parse({});

/** Parses Express **`req.query`** (or any compatible record) for prediction browse. */
export function parsePredictionBrowseQuery(query: unknown) {
  return predictionBrowseQuerySchema.safeParse(query);
}

/**
 * Canonical **`GET`** query params for **`/predictions`** (HTML browse).
 *
 * Omits **`page`** when it equals {@link PREDICTION_BROWSE_DEFAULT_PAGE} and **`page_size`** when it equals
 * {@link PREDICTION_BROWSE_DEFAULT_PAGE_SIZE} (plan step 13). Also omits **`sort_by`** when it equals the browse
 * default {@link PREDICTION_BROWSE_DEFAULT_SORT_BY} so a default browse needs no `?` query prefix.
 *
 * Uses **`unbetter_id`** on the wire (not **`unbetter`**), matching the location-bar convention described on
 * {@link predictionBrowseQuerySchema}.
 */
export function serializePredictionBrowseQuery(
  query: PredictionBrowseQuery,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const s of query.status) {
    params.append("status", s);
  }

  if (query.sort_by !== PREDICTION_BROWSE_DEFAULT_SORT_BY) {
    params.set("sort_by", query.sort_by);
  }

  if (query.keyword !== undefined) {
    params.set("keyword", query.keyword);
  }

  if (query.creator !== undefined) {
    params.set("creator", query.creator);
  }

  if (query.unbetter !== undefined) {
    params.set("unbetter_id", query.unbetter);
  }

  if (query.season_id !== undefined) {
    params.set("season_id", String(query.season_id));
  }

  if (query.include_non_season_applicable) {
    params.set("include_non_season_applicable", "true");
  }

  if (query.page !== PREDICTION_BROWSE_DEFAULT_PAGE) {
    params.set("page", String(query.page));
  }

  if (query.page_size !== PREDICTION_BROWSE_DEFAULT_PAGE_SIZE) {
    params.set("page_size", String(query.page_size));
  }

  return params;
}
