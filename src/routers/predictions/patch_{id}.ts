import { add, isAfter } from "date-fns";
import express from "express";
import GAME_MECHANICS from "../../config/game_mechanics";
import { isNumberParseableString } from "../../helpers/typeguards";
import predictions from "../../queries/predictions";
import { APIPredictions } from "../../types/predicitions";
import responseUtils from "../../utils/response";
const router = express.Router();

router.patch("/:prediction_id", async (req, res) => {
  const { prediction_id } = req.params;
  const { discord_id } = req.body;

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

  // Fetch prediction
  let prediction: APIPredictions.EnhancedPrediction;

  try {
    prediction = await predictions.getByPredictionId(prediction_id);
    if (!prediction) {
      return res
        .status(404)
        .json(
          responseUtils.writeError(
            "BAD_REQUEST",
            `Predicton with id ${prediction_id} does not exist.`
          )
        );
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json(
        responseUtils.writeError("SERVER_ERROR", "Unable to fetch prediction.")
      );
  }

  // Verify prediction is open
  if (prediction.closed_date !== null) {
    return res
      .status(400)
      .json(
        responseUtils.writeError(
          "BAD_REQUEST",
          "This prediction has already closed and cannot be altered"
        )
      );
  }

  // Verify prediction is owned by updater
  if (prediction.predictor.discord_id !== discord_id) {
    return res
      .status(403)
      .json(
        responseUtils.writeError(
          "AUTHENTICATION_ERROR",
          "This prediction does not belong to you."
        )
      );
  }

  // Verify that prediction retirement is within allowable time window
  // Predictions cannot be retired after their specified window, or
  // the due date, which ever comes first
  const now = new Date();
  const expiryWindow = add(new Date(prediction.created_date), {
    hours: GAME_MECHANICS.predictionUpdateWindow,
  });
  const dueDate = new Date(prediction.due_date);
  const effectiveExpiryWindow = isAfter(expiryWindow, dueDate)
    ? dueDate
    : expiryWindow;

  if (isAfter(now, effectiveExpiryWindow)) {
    return res
      .status(403)
      .json(
        responseUtils.writeError(
          "BAD_REQUEST",
          "This prediction is past the retirement window and is not locked and cannot be retired."
        )
      );
  }

  return predictions
    .retirePredictionById(prediction_id)
    .then((prediction) => {
      return res.json(
        responseUtils.writeSuccess(
          prediction,
          "Prediction retired successfully."
        )
      );
    })
    .catch((err) => {
      console.error(err);
      return res
        .status(500)
        .json(
          responseUtils.writeError(
            "SERVER_ERROR",
            "There was an error retiring this prediction."
          )
        );
    });
});

export default router;
