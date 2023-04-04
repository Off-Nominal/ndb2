import { add, isAfter } from "date-fns";
import express, { Request, Response } from "express";
import GAME_MECHANICS from "../../config/game_mechanics";
import webhookManager from "../../config/webhook_subscribers";
import paramValidator from "../../middleware/paramValidator";
import { getPrediction } from "../../middleware/getPrediction";
import predictionStatusValidator from "../../middleware/predictionStatusValidator";
import predictions from "../../queries/predictions";
import { PredictionLifeCycle } from "../../types/predicitions";
import responseUtils from "../../utils/response";
import { getDbClient } from "../../middleware/getDbClient";
const router = express.Router();

router.patch(
  "/:prediction_id/retire",
  [
    paramValidator.numberParseableString("discord_id", { type: "body" }),
    paramValidator.integerParseableString("prediction_id", { type: "params" }),
    paramValidator.isPostgresInt("prediction_id", { type: "params" }),
    getDbClient,
    getPrediction,
    predictionStatusValidator(PredictionLifeCycle.OPEN),
  ],
  async (req: Request, res: Response) => {
    const { discord_id } = req.body;

    // Verify prediction is owned by updater
    if (req.prediction.predictor.discord_id !== discord_id) {
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
    const expiryWindow = add(new Date(req.prediction.created_date), {
      hours: GAME_MECHANICS.predictionUpdateWindow,
    });
    const dueDate = new Date(req.prediction.due_date);
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
      .retirePredictionById(req.dbClient)(req.prediction.id)
      .then(() =>
        predictions.getByPredictionId(req.dbClient)(req.prediction.id)
      )
      .then((prediction) => {
        // Notify subscribers
        webhookManager.emit("retired_prediction", prediction);

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
      })
      .finally(() => req.dbClient.release());
  }
);

export default router;
