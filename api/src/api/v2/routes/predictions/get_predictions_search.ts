import { z } from "zod";
import { Route } from "../../utils/routerMap";
import responseUtils from "../../utils/response";
import { validate } from "../../middleware/validate";
import { getDbClient } from "../../../../data/db/getDbClient";
import predictions from "../../../../data/queries/predictions";
import { getUserByDiscordId } from "../../../../data/queries/users/users.queries";
import * as API from "@offnominal/ndb2-api-types/v2";
import {
  createBooleanStringSchema,
  discordIdSchema,
  queryParamMulti,
  queryParamScalar,
  optionalTrimmedStringSchema,
  seasonIdSchema,
} from "../../validations";
import { wrapRouteWithErrorBoundary } from "../../middleware/errorHandler";

/**
 * Zod schema for `GET /predictions/search` query string validation.
 *
 * **Wire format:** Aligns with `API.Endpoints.Predictions.GET_Search.Query` and
 * `GET_Search.toURLSearchParams()` in `@offnominal/ndb2-api-types`.
 *
 * **Preprocessing:** `queryParamScalar` / `queryParamMulti` normalize Express `req.query`
 * (`undefined`, `null`, `""`, and repeated keys as `string | string[]`) before the inner schema runs.
 *
 * | Param | Role |
 * |-------|------|
 * | `status` | Optional. One or more lifecycle values; repeat the key or pass one value. Drives SQL `statuses` filter when non-empty. |
 * | `sort_by` | Optional. Single sort key; if the key is repeated, only the **first** value is used. |
 * | `keyword` | Optional. Max 500 chars. See keyword tuning and matching rules in `api/src/data/queries/predictions/predictions.sql` (`searchPredictions` comment block). |
 * | `creator` | Optional. Predictor filter: Discord snowflake (`discordIdSchema`). Resolved to internal user id; unknown id → 404 `USER_NOT_FOUND`. |
 * | `unbetter` | Optional. Exclude predictions where this Discord user has a bet (`discordIdSchema`). Same lookup rules as `creator`. |
 * | `season_id` | Optional. Coerced to a Postgres INT (positive, in range). |
 * | `include_non_season_applicable` | Optional. `"true"` / `"false"` only; when filtering by `season_id`, controls whether non–season-applicable rows are included. |
 * | `page` | Optional. 1-based page index; defaults to 1 in the DB layer when omitted. Must be a positive integer when present. |
 *
 * **Cross-field rules (`.refine`):**
 * 1. At least one of: non-empty `status`, `sort_by`, non-empty `keyword`, `creator`, `unbetter`, or `season_id`.
 * 2. `creator` and `unbetter` cannot both be set to the **same** Discord id.
 */
const searchQuerySchema = z
  .object({
    status: queryParamMulti(
      z
        .array(z.enum(API.Entities.Predictions.PREDICTION_LIFECYCLE_VALUES))
        .optional(),
    ),
    sort_by: queryParamScalar(
      z.enum(API.Endpoints.Predictions.GET_Search.SORT_BY_VALUES).optional(),
    ),
    keyword: queryParamScalar(
      optionalTrimmedStringSchema.refine(
        (s) => s === undefined || s.length <= 500,
        { message: "keyword must be at most 500 characters" },
      ),
    ),
    creator: queryParamScalar(discordIdSchema.optional()),
    unbetter: queryParamScalar(discordIdSchema.optional()),
    season_id: queryParamScalar(seasonIdSchema.optional()),
    include_non_season_applicable: queryParamScalar(
      createBooleanStringSchema({
        propName: "include_non_season_applicable",
      }).optional(),
    ),
    page: queryParamScalar(z.coerce.number().int().positive().optional()),
  })
  .refine(
    (q) => {
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
    },
    {
      message:
        "Please provide at least one standard query parameter in your search.",
    },
  )
  .refine((q) => !q.creator || !q.unbetter || q.creator !== q.unbetter, {
    message:
      'Filtering by the same "creator" and "unbetter" is not allowed. These values must be different or omitted.',
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
