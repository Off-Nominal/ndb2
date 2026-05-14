import { z } from "zod";
import { Route } from "@shared/routerMap";
import responseUtils from "../../utils/response";
import { validate } from "../../middleware/validate";
import { getDbClient } from "@data/db/getDbClient";
import predictions from "@data/queries/predictions";
import { getUserByDiscordId } from "@data/queries/users/users.queries";
import * as API from "@offnominal/ndb2-api-types/v2";
import { wrapRouteWithErrorBoundary } from "../../middleware/errorHandler";
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

const predictionSearchQueryFieldsSchema = z.object({
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
});

type PredictionSearchQueryFields = z.infer<
  typeof predictionSearchQueryFieldsSchema
>;

const PREDICTION_SEARCH_REQUIRES_STANDARD_PARAM_MESSAGE =
  "Please provide at least one standard query parameter in your search.";

/** v2-only: at least one discriminating filter must be present on `GET /predictions/search`. */
function predictionSearchRequiresStandardParam(
  q: PredictionSearchQueryFields,
): boolean {
  const hasStatus = q.status !== undefined && q.status.length > 0;
  const hasSort = q.sort_by !== undefined;
  const hasKeyword = q.keyword !== undefined && q.keyword.length > 0;
  const hasCreator = q.creator !== undefined;
  const hasUnbetter = q.unbetter !== undefined;
  const hasSeason = q.season_id !== undefined;
  return (
    hasStatus ||
    hasSort ||
    hasKeyword ||
    hasCreator ||
    hasUnbetter ||
    hasSeason
  );
}

/**
 * Zod schema for `GET /predictions/search` query string validation.
 *
 * **Cross-field rules:**
 * 1. At least one of: non-empty `status`, `sort_by`, non-empty `keyword`, `creator`, `unbetter`, or `season_id`.
 * 2. `creator` and `unbetter` cannot both be set to the **same** Discord id.
 */
const searchQuerySchema = predictionSearchQueryFieldsSchema
  .refine(predictionSearchRequiresStandardParam, {
    message: PREDICTION_SEARCH_REQUIRES_STANDARD_PARAM_MESSAGE,
  })
  .refine(predictionSearchCreatorDistinctFromUnbetter, {
    message: PREDICTION_SEARCH_CREATOR_UNBETTER_DISTINCT_MESSAGE,
  });

export const getPredictionsSearch: Route = (router) => {
  router.get(
    "/search",
    validate({
      query: searchQuerySchema,
    }),
    wrapRouteWithErrorBoundary(async (req, res) => {
      const q = req.query;

      const dbClient = await getDbClient(res);

      let creator_id: string | undefined;
      let unbetter_id: string | undefined;

      if (q.creator) {
        const [user] = await getUserByDiscordId.run(
          { discord_id: q.creator },
          dbClient,
        );
        if (!user) {
          return res.status(404).json(
            responseUtils.writeErrors([
              {
                code: API.Errors.USER_NOT_FOUND,
                message:
                  "Creator user does not exist or has never interacted with NDB2",
              },
            ]),
          );
        }
        creator_id = user.id;
      }

      if (q.unbetter) {
        const [user] = await getUserByDiscordId.run(
          { discord_id: q.unbetter },
          dbClient,
        );
        if (!user) {
          return res.status(404).json(
            responseUtils.writeErrors([
              {
                code: API.Errors.USER_NOT_FOUND,
                message:
                  "Unbetter user does not exist or has never interacted with NDB2",
              },
            ]),
          );
        }
        unbetter_id = user.id;
      }

      const rows = await predictions.search(dbClient)({
        keyword: q.keyword ?? null,
        sort_by: q.sort_by ?? null,
        statuses:
          q.status !== undefined && q.status.length > 0 ? q.status : null,
        page: q.page ?? null,
        page_size: q.page_size,
        predictor_id: q.creator ? creator_id! : null,
        non_better_id: q.unbetter ? unbetter_id! : null,
        season_id: q.season_id ?? null,
        include_non_applicable: q.include_non_season_applicable ?? false,
      });

      return res.json(
        responseUtils.writeSuccess(rows, "Predictions fetched successfully."),
      );
    }),
  );
};
