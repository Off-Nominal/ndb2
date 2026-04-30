import { Router } from "express";
import { z } from "zod";
import { Route } from "@shared/routerMap";
import * as API from "@offnominal/ndb2-api-types/v2";
import responseUtils from "../../utils/response";
import { validate } from "../../middleware/validate";
import { getDbClient } from "@data/db/getDbClient";
import { wrapRouteWithErrorBoundary } from "../../middleware/errorHandler";
import {
  discordIdSchema,
  seasonLookupParamSchema,
  seasonLookupPathToEntityIdentifier,
} from "../../validations";
import seasons from "@data/queries/seasons";
import results from "@data/queries/results";
import { getUserByDiscordId } from "@data/queries/users/users.queries";

export const getSeasonResultForDiscordUser: Route = (router: Router) => {
  router.get(
    "/:id/users/discord_id/:discord_id/result",
    validate({
      params: z.object({
        id: seasonLookupParamSchema,
        discord_id: discordIdSchema,
      }),
    }),
    wrapRouteWithErrorBoundary(async (req, res) => {
      const lookup = req.params.id;
      const { discord_id } = req.params;

      const dbClient = await getDbClient(res);

      const [user] = await getUserByDiscordId.run({ discord_id }, dbClient);
      if (!user) {
        return res.status(404).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.USER_NOT_FOUND,
              message:
                "User does not exist or has never interacted with NDB2.",
            },
          ]),
        );
      }

      const seasonId =
        lookup.kind === "id"
          ? lookup.id
          : await seasons.getSeasonIdByIdentifier(dbClient)(
              seasonLookupPathToEntityIdentifier(lookup),
            );

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

      const data = await results.getSeasonResultForUser(dbClient)(
        seasonId,
        user.id,
      );

      if (!data) {
        return res.status(404).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.RESULT_NOT_FOUND,
              message: "No result for this user in this season.",
            },
          ]),
        );
      }

      return res.json(
        responseUtils.writeSuccess(data, "Season result fetched successfully."),
      );
    }),
  );

  return router;
};
