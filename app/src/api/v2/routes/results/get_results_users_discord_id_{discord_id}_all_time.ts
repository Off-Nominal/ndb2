import { Router } from "express";
import { z } from "zod";
import { Route } from "@shared/routerMap";
import * as API from "@offnominal/ndb2-api-types/v2";
import responseUtils from "../../utils/response";
import { validate } from "../../middleware/validate";
import { getDbClient } from "@data/db/getDbClient";
import { wrapRouteWithErrorBoundary } from "../../middleware/errorHandler";
import { discordIdSchema } from "../../validations";
import results from "@data/queries/results";
import { getUserByDiscordId } from "@data/queries/users/users.queries";

export const getResultsUserAllTime: Route = (router: Router) => {
  router.get(
    "/users/discord_id/:discord_id/all-time",
    validate({
      params: z.object({
        discord_id: discordIdSchema,
      }),
    }),
    wrapRouteWithErrorBoundary(async (req, res) => {
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

      const data = await results.getAllTimeResultForUser(dbClient)(user.id);
      if (!data) {
        return res.status(500).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.SERVER_ERROR,
              message: "Failed to load all-time result.",
            },
          ]),
        );
      }

      return res.json(
        responseUtils.writeSuccess(
          data,
          "All-time user results fetched successfully.",
        ),
      );
    }),
  );

  return router;
};
