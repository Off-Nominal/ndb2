import { Router } from "express";
import { z } from "zod";
import { discordIdSchema, predictionIdSchema } from "@shared/validation";
import { Route } from "@shared/routerMap";
import responseUtils from "../../utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";
import { validate } from "../../middleware/validate";
import { getDbClient } from "@data/db/getDbClient";
import { wrapRouteWithErrorBoundary } from "../../middleware/errorHandler";
import predictions from "@data/queries/predictions";
import { eventsManager } from "@domain/events/events-manager";
import {
  placeBet,
  type PlaceBetErrorCode,
} from "@domain/bets/place-bet";

function httpStatusForPlaceBetFailure(code: PlaceBetErrorCode): number {
  switch (code) {
    case API.Errors.PREDICTION_NOT_FOUND:
      return 404;
    case API.Errors.BETS_UNCHANGEABLE:
      return 403;
    default:
      return 400;
  }
}

export const postPredictionBet: Route = (router: Router) => {
  router.post(
    "/:prediction_id/bets",
    validate({
      params: z.object({
        prediction_id: predictionIdSchema,
      }),
      body: z.object({
        discord_id: discordIdSchema,
        endorsed: z.boolean({
          message: "Property 'endorsed' must be a boolean",
        }),
      }),
    }),
    wrapRouteWithErrorBoundary(async (req, res) => {
      const { prediction_id } = req.params;
      const { discord_id, endorsed } = req.body;

      const dbClient = await getDbClient(res);

      const result = await placeBet(dbClient, {
        prediction_id,
        discord_id,
        endorsed,
      });

      if (!result.ok) {
        return res.status(httpStatusForPlaceBetFailure(result.code)).json(
          responseUtils.writeErrors([
            { code: result.code, message: result.message },
          ]),
        );
      }

      const updated = await predictions.getById(dbClient)(prediction_id);
      if (!updated) {
        return res.status(500).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.SERVER_ERROR,
              message: "Prediction not found after bet.",
            },
          ]),
        );
      }

      eventsManager.emit("new_bet", updated);

      const message =
        result.outcome === "changed"
          ? "Bet successfully changed"
          : "Bet created successfully";

      return res.json(responseUtils.writeSuccess(updated, message));
    }),
  );
};
