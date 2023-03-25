import express from "express";
import webhookManager from "../../config/webhook_subscribers";
import bodyValidator from "../../middleware/bodyValidator";
import { getPrediction } from "../../middleware/getPrediction";
import bets from "../../queries/bets";
import predictions from "../../queries/predictions";
import users from "../../queries/users";
import { PredictionLifeCycle } from "../../types/predicitions";
import responseUtils from "../../utils/response";
const router = express.Router();

router.post(
  "/:prediction_id/bets",
  [
    bodyValidator.numberParseableString("discord_id"),
    bodyValidator.numberParseableString("prediction_id"),
    bodyValidator.boolean("endorsed"),
    getPrediction,
  ],
  async (req, res) => {
    const { discord_id, endorsed } = req.body;

    // Fetch User
    let userId: string;

    try {
      const user = await users.getOrAddByDiscordId(discord_id);
      userId = user.id;
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json(responseUtils.writeError("SERVER_ERROR", "Error fetching user"));
    }

    // Validate that prediction is open
    if (
      req.prediction.status === PredictionLifeCycle.CLOSED ||
      req.prediction.status === PredictionLifeCycle.FAILED ||
      req.prediction.status === PredictionLifeCycle.SUCCESSFUL
    ) {
      return res
        .status(400)
        .json(responseUtils.writeError("BAD_REQUEST", "Prediction is closed."));
    }

    // Validate that prediction is not retired
    if (req.prediction.status === PredictionLifeCycle.RETIRED) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            "BAD_REQUEST",
            "Prediction was retired by predictor."
          )
        );
    }

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
      .add(userId, req.prediction.id, endorsed, date)
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
