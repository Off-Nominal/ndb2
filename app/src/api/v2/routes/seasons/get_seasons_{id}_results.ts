import { Router } from "express";
import { z } from "zod";
import { Route } from "@shared/routerMap";
import * as API from "@offnominal/ndb2-api-types/v2";
import responseUtils from "../../utils/response";
import { validate } from "../../middleware/validate";
import { getDbClient } from "@data/db/getDbClient";
import { wrapRouteWithErrorBoundary } from "../../middleware/errorHandler";
import {
  seasonLookupParamSchema,
  seasonResultsLeaderboardQuerySchema,
} from "../../validations";
import seasons from "@data/queries/seasons";
import results from "@data/queries/results";

export const getSeasonResults: Route = (router: Router) => {
  router.get(
    "/:id/results",
    validate({
      params: z.object({
        id: seasonLookupParamSchema,
      }),
      query: seasonResultsLeaderboardQuerySchema,
    }),
    wrapRouteWithErrorBoundary(async (req, res) => {
      const lookup = req.params.id;
      const dbClient = await getDbClient(res);

      const seasonId =
        lookup.kind === "id"
          ? lookup.id
          : await seasons.getSeasonIdByIdentifier(dbClient)(lookup.identifier);

      if (seasonId === null) {
        return res.status(404).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.SEASON_NOT_FOUND,
              message: "Season not found.",
            },
          ]),
        );
      }

      const season = await seasons.getById(dbClient)(seasonId);
      if (!season) {
        return res.status(404).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.SEASON_NOT_FOUND,
              message: "Season not found.",
            },
          ]),
        );
      }

      const q = req.query as z.infer<typeof seasonResultsLeaderboardQuerySchema>;
      const payload = await results.getSeasonLeaderboard(dbClient)({
        season_id: seasonId,
        sort_by: q.sort_by,
        page: q.page,
        per_page: q.per_page,
      });

      return res.json(
        responseUtils.writeSuccess(
          payload,
          "Season results fetched successfully.",
        ),
      );
    }),
  );

  return router;
};
