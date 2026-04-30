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
  userSeasonResultsListQuerySchema,
} from "../../validations";
import results from "@data/queries/results";
import { getUserByDiscordId } from "@data/queries/users/users.queries";

export const getResultsUserSeasonsList: Route = (router: Router) => {
  router.get(
    "/users/discord_id/:discord_id",
    validate({
      params: z.object({
        discord_id: discordIdSchema,
      }),
      query: userSeasonResultsListQuerySchema,
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
              message: "User does not exist or has never interacted with NDB2.",
            },
          ]),
        );
      }

      const q = req.query as z.infer<typeof userSeasonResultsListQuerySchema>;
      const payload = await results.getUserSeasonResults(dbClient)({
        user_id: user.id,
        sort_by: q.sort_by,
        page: q.page,
        per_page: q.per_page,
      });

      return res.json(
        responseUtils.writeSuccess(
          payload,
          "User season results fetched successfully.",
        ),
      );
    }),
  );

  return router;
};
