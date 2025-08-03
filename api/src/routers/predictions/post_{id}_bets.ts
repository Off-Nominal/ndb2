import express, { Request, Response } from "express";
import webhookManager from "../../config/webhook_subscribers";
import paramValidator from "../../middleware/deprecated/paramValidator";
import { getPrediction } from "../../middleware/deprecated/getPrediction";
import { getUserByDiscordId } from "../../middleware/deprecated/getUserByDiscordId";
import predictionStatusValidator from "../../middleware/deprecated/predictionStatusValidator";
import bets from "../../db/queries/bets";
import predictions from "../../db/queries/predictions";
import { PredictionLifeCycle } from "../../types/predicitions";
import responseUtils_deprecated from "../../utils/response";
import { getDbClient } from "../../middleware/deprecated/getDbClient";
import { add, isAfter } from "date-fns";
import GAME_MECHANICS from "../../config/game_mechanics";
import { ErrorCode } from "../../types/responses";
const router = express.Router();

router.post(
  "/:prediction_id/bets",
  [
    paramValidator.boolean("endorsed", { type: "body" }),
    paramValidator.numberParseableString("discord_id", { type: "body" }),
    paramValidator.integerParseableString("prediction_id", { type: "params" }),
    paramValidator.isPostgresInt("prediction_id", { type: "params" }),
    getDbClient,
    getUserByDiscordId,
    getPrediction,
    predictionStatusValidator(PredictionLifeCycle.OPEN),
  ],
  async (req: Request, res: Response) => {
    if (!req.prediction || !req.dbClient || !req.user_id) {
      return res
        .status(500)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.SERVER_ERROR,
            "Something went wrong. Please try again.",
            null
          )
        );
    }
    const { discord_id, endorsed } = req.body;

    // Validate if bet has already been made by the user
    const bet = req.prediction.bets.find(
      (b) => b.better.discord_id === discord_id
    );

    if (bet) {
      // Reject if existing bet matches change request
      if (bet.endorsed === endorsed) {
        return res
          .status(400)
          .json(
            responseUtils_deprecated.writeError(
              ErrorCode.BETS_NO_CHANGE,
              `You have already ${
                bet.endorsed ? "endorsed" : "undorsed"
              } this prediction. No change necessary.`,
              req.prediction
            )
          );
      }

      // Reject if change is outside the allowable time window
      const now = new Date();
      const expiryWindow = add(new Date(bet.date), {
        hours: GAME_MECHANICS.predictionUpdateWindow,
      });

      if (isAfter(now, expiryWindow)) {
        return res
          .status(403)
          .json(
            responseUtils_deprecated.writeError(
              ErrorCode.BETS_UNCHANGEABLE,
              `Bets cannot be changed past the allowable time window of ${GAME_MECHANICS.predictionUpdateWindow} hours since the bet was made.`,
              null
            )
          );
      }
    }

    bets
      .add(req.dbClient)(req.user_id, req.prediction.id, endorsed)
      .then((b) => {
        if (!req.prediction || !req.dbClient) {
          throw new Error("Prediction or DB client is not defined");
        }
        return predictions.getPredictionById(req.dbClient)(b.prediction_id);
      })
      .then((ep) => {
        if (!ep) {
          throw new Error("Prediction not found");
        }
        // Notify subscribers
        webhookManager.emit("new_bet", ep);

        const message = !!bet
          ? "Bet successfully changed"
          : "Bet created successfully";

        res.json(responseUtils_deprecated.writeSuccess(ep, message));
      })
      .catch((err) => {
        console.error(err);
        res
          .status(500)
          .json(
            responseUtils_deprecated.writeError(
              ErrorCode.SERVER_ERROR,
              "Error Adding bet",
              null
            )
          );
      });
  }
);

export default router;
