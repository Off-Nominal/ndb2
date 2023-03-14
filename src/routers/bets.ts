import express from "express";
import { isBoolean, isNumberParseableString } from "../helpers/typeguards";
import bets from "../queries/bets";
import predictions from "../queries/predictions";
import users from "../queries/users";
import { APIPredictions } from "../types/predicitions";
import responseUtils from "../utils/response";

const router = express.Router();

router.post("/", async (req, res) => {
  const { discord_id, prediction_id, endorsed } = req.body;

  // Body parameter validation
  if (!isNumberParseableString(discord_id)) {
    return res
      .status(400)
      .json(
        responseUtils.writeError(
          "MALFORMED_BODY_DATA",
          "Discord Ids must be a parseable as number"
        )
      );
  }

  // Body parameter validation
  if (!isNumberParseableString(prediction_id)) {
    return res
      .status(400)
      .json(
        responseUtils.writeError(
          "MALFORMED_BODY_DATA",
          "Predictions Ids must be a parseable as number"
        )
      );
  }

  // Body parameter validation
  if (!isBoolean(endorsed)) {
    return res
      .status(400)
      .json(
        responseUtils.writeError(
          "MALFORMED_BODY_DATA",
          "Endorsed values must be a parseable as a boolean"
        )
      );
  }

  // Fetch User
  let userId: string;

  try {
    const user = await users.getOrAddByDiscordId(discord_id);
    userId = user.id;
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json(responseUtils.writeError("SERVER_ERROR", "Error Adding user"));
  }

  // Fetch Prediction
  let prediction: APIPredictions.EnhancedPrediction;

  try {
    prediction = await predictions.getByPredictionId(prediction_id);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json(
        responseUtils.writeError(
          "SERVER_ERROR",
          "Error validating if bet has already been made."
        )
      );
  }

  // Validate that prediction is open
  if (prediction.closed_date) {
    return res
      .status(400)
      .json(responseUtils.writeError("BAD_REQUEST", "Prediction is closed."));
  }

  // Validate if bet has already been made
  const bet = prediction.bets.find(
    (b) => b.better.discord_id === discord_id.toString()
  );
  if (bet) {
    return res
      .status(400)
      .json(
        responseUtils.writeError(
          "BAD_REQUEST",
          "User has already bet on this prediction."
        )
      );
  }

  // Add bet
  const date = new Date();

  bets
    .add(userId, prediction_id, endorsed, date)
    .then((b) => predictions.getByPredictionId(b.prediction_id))
    .then((ep) => {
      res.json(responseUtils.writeSuccess(ep, "Bet created successfully."));
    })
    .catch((err) => {
      console.error(err);
      res
        .status(500)
        .json(responseUtils.writeError("SERVER_ERROR", "Error Adding bet"));
    });
});

export default router;