import { Router } from "express";
import { z } from "zod";
import { add, isAfter } from "date-fns";
import { discordIdSchema, predictionIdSchema } from "../../validations";
import { Route } from "@shared/routerMap";
import predictions from "@data/queries/predictions";
import betsQueries from "@data/queries/bets";
import users from "@data/queries/users";
import responseUtils from "../../utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";
import { validate } from "../../middleware/validate";
import { getDbClient } from "@data/db/getDbClient";
import { eventsManager } from "@domain/events/eventsManager";
import GAME_MECHANICS from "@domain/gameMechanics";
import { wrapRouteWithErrorBoundary } from "../../middleware/errorHandler";

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

      const prediction = await predictions.getById(dbClient)(prediction_id);

      if (!prediction) {
        return res.status(404).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.PREDICTION_NOT_FOUND,
              message: `Prediction with id ${prediction_id} does not exist.`,
            },
          ]),
        );
      }

      if (prediction.status !== "open") {
        return res.status(400).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.INVALID_PREDICTION_STATUS,
              message: "Bets can only be placed on open predictions.",
            },
          ]),
        );
      }

      const user = await users.getByDiscordId(dbClient)(discord_id);
      const bet = prediction.bets.find(
        (b) => b.better.discord_id === discord_id,
      );

      if (bet) {
        if (bet.endorsed === endorsed) {
          return res.status(400).json(
            responseUtils.writeErrors([
              {
                code: API.Errors.BETS_NO_CHANGE,
                message: `You have already ${
                  bet.endorsed ? "endorsed" : "undorsed"
                } this prediction. No change necessary.`,
              },
            ]),
          );
        }

        const now = new Date();
        const expiryWindow = add(new Date(bet.date), {
          hours: GAME_MECHANICS.predictionUpdateWindow,
        });

        if (isAfter(now, expiryWindow)) {
          return res.status(403).json(
            responseUtils.writeErrors([
              {
                code: API.Errors.BETS_UNCHANGEABLE,
                message: `Bets cannot be changed past the allowable time window of ${GAME_MECHANICS.predictionUpdateWindow} hours since the bet was made.`,
              },
            ]),
          );
        }
      }

      await betsQueries.add(dbClient)({
        user_id: user.id,
        prediction_id,
        endorsed,
        date: new Date(),
      });

      const updated = await predictions.getById(dbClient)(prediction_id);
      if (!updated) {
        throw new Error("Prediction not found after bet");
      }

      eventsManager.emit("new_bet", updated);

      const message = bet
        ? "Bet successfully changed"
        : "Bet created successfully";

      return res.json(responseUtils.writeSuccess(updated, message));
    }),
  );
};
