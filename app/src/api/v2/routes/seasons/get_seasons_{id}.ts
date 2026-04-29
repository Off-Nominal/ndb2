import { Router } from "express";
import { z } from "zod";
import { Route } from "@shared/routerMap";
import seasons from "@data/queries/seasons";
import responseUtils from "../../utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";
import { validate } from "../../middleware/validate";
import { getDbClient } from "@data/db/getDbClient";
import { wrapRouteWithErrorBoundary } from "../../middleware/errorHandler";
import { seasonLookupParamSchema } from "../../validations";

export const getSeason: Route = (router: Router) => {
  router.get(
    "/:id",
    validate({
      params: z.object({
        id: seasonLookupParamSchema,
      }),
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

      const detail = await seasons.getById(dbClient)(seasonId);

      if (!detail) {
        return res.status(404).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.SEASON_NOT_FOUND,
              message: "Season not found.",
            },
          ]),
        );
      }

      return res.json(
        responseUtils.writeSuccess(detail, "Season fetched successfully."),
      );
    }),
  );

  return router;
};
