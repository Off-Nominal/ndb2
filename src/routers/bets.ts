import express from "express";
import { isBoolean, isNumber } from "../helpers/typeguards";
import bets from "../queries/bets";
import predictions from "../queries/predictions";
import users from "../queries/users";
import { APIPredictions } from "../types/predicitions";
import { addRatiosToPrediction } from "../utils/mechanics";
import responseUtils from "../utils/response";

const router = express.Router();

router.post("/", async (req, res) => {
  const { discord_id, prediction_id, endorsed } = req.body;

  console.log(req.body);

  // Body parameter validation
  if (!isNumber(discord_id)) {
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
  if (!isNumber(prediction_id)) {
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

  // Validate if bet has already been made
  try {
    const bet = await bets.getBetByUserIdAndPredictionId(userId, prediction_id);
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
