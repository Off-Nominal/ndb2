import { z } from "zod";
import * as API from "@offnominal/ndb2-api-types/v2";
import {
  queryParamMulti,
  queryParamScalar,
  optionalTrimmedStringSchema,
} from "@shared/validation/http";
import {
  createBooleanStringSchema,
  discordIdSchema,
  seasonIdSchema,
} from "@shared/validation/domain";

/**
 * Shared **wire-normalised** query field schemas for prediction search / browse.
 *
 * **Preprocessing:** each field uses {@link queryParamScalar} or {@link queryParamMulti} from `@shared/validation/http`
 * so Express `req.query` shapes (`string | string[] | undefined`) validate consistently.
 *
 * Call sites compose their own {@link z.object}; see `get_predictions_search.ts` and `parse-prediction-browse-query.ts`.
 *
 * **Product-level rules** (predictor ≠ unbetter, browse defaults, `unbetter_id` alias, and
 * v2-only “at least one filter”) are composed **outside** this module.
 */

export const predictionSearchQueryStatusSchema = queryParamMulti(
  z
    .array(z.enum(API.Entities.Predictions.PREDICTION_LIFECYCLE_VALUES))
    .optional(),
);

export const predictionSearchQuerySortBySchema = queryParamScalar(
  z.enum(API.Endpoints.Predictions.GET_Search.SORT_BY_VALUES).optional(),
);

export const predictionSearchQueryKeywordSchema = queryParamScalar(
  optionalTrimmedStringSchema.refine(
    (s) => s === undefined || s.length <= 500,
    { message: "keyword must be at most 500 characters" },
  ),
);

/** Optional predictor Discord snowflake — wire query key **`creator`** (v2 **`GET /predictions/search`** + HTML browse). */
export const predictionSearchQueryPredictorSchema = queryParamScalar(
  discordIdSchema.optional(),
);

export const predictionSearchQueryUnbetterSchema = queryParamScalar(
  discordIdSchema.optional(),
);

export const predictionSearchQuerySeasonIdSchema = queryParamScalar(
  seasonIdSchema.optional(),
);

export const predictionSearchQueryIncludeNonSeasonApplicableSchema =
  queryParamScalar(
    createBooleanStringSchema({
      propName: "include_non_season_applicable",
    }).optional(),
  );

export const predictionSearchQueryPageSchema = queryParamScalar(
  z.coerce.number().int().positive().optional(),
);

export const predictionSearchQueryPageSizeSchema = queryParamScalar(
  z.coerce
    .number()
    .int()
    .refine((n) => n === 10 || n === 25 || n === 50, {
      message: "page_size must be 10, 25, or 50",
    })
    .optional(),
);

export const PREDICTION_SEARCH_PREDICTOR_UNBETTER_DISTINCT_MESSAGE =
  'Filtering by the same "predictor" and "unbetter" is not allowed. These values must be different or omitted.';

/** Shared by v2 search (wire **`creator`**) and HTML browse (**`predictor`**) after `unbetter` is resolved (including `unbetter_id` → `unbetter`). */
export function predictionSearchPredictorDistinctFromUnbetter(q: {
  predictor?: string | undefined;
  unbetter?: string | undefined;
}): boolean {
  return !q.predictor || !q.unbetter || q.predictor !== q.unbetter;
}
