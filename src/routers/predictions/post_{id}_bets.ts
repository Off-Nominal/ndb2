import express from "express";
import webhookManager from "../../config/webhook_subscribers";
import paramValidator from "../../middleware/paramValidator";
import { getPrediction } from "../../middleware/getPrediction";
import { getUserByDiscordId } from "../../middleware/getUserByDiscordId";
import predictionStatusValidator from "../../middleware/predictionStatusValidator";
import bets from "../../queries/bets";
import predictions from "../../queries/predictions";
import { PredictionLifeCycle } from "../../types/predicitions";
import responseUtils from "../../utils/response";
const router = express.Router();

router.post(
  "/:prediction_id/bets",
  [
    paramValidator.boolean("endorsed", { type: "body" }),
    paramValidator.numberParseableString("discord_id", { type: "body" }),
    paramValidator.integerParseableString("prediction_id", { type: "params" }),
    paramValidator.isPostgresInt("prediction_id", { type: "params" }),
    getUserByDiscordId,
    getPrediction,
    predictionStatusValidator(PredictionLifeCycle.OPEN),
  ],
  async (req, res) => {
    const { discord_id, endorsed } = req.body;

    // Validate if bet has already been made by the user
    const bet = req.prediction.bets.find(
      (b) => b.better.discord_id === discord_id
    );

    if (bet) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            "BAD_REQUEST",
            `You have already ${
              bet.endorsed ? "endorsed" : "undorsed"
            } this prediction.`
          )
        );
    }

    // Add bet
    const date = new Date();

    bets
      .add(req.user_id, req.prediction.id, endorsed, date)
      .then((b) => predictions.getByPredictionId(b.prediction_id))
      .then((ep) => {
        // Notify subscribers
        webhookManager.emit("new_bet", ep);

        res.json(responseUtils.writeSuccess(ep, "Bet created successfully."));
      })
      .catch((err) => {
        console.error(err);
        res
          .status(500)
          .json(responseUtils.writeError("SERVER_ERROR", "Error Adding bet"));
      });
  }
);

export default router;
