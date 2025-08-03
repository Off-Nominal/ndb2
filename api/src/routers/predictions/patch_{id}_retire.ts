import { add, isAfter } from "date-fns";
import express, { Request, Response } from "express";
import GAME_MECHANICS from "../../config/game_mechanics";
import webhookManager from "../../config/webhook_subscribers";
import paramValidator from "../../middleware/deprecated/paramValidator";
import { getPrediction } from "../../middleware/deprecated/getPrediction";
import predictionStatusValidator from "../../middleware/deprecated/predictionStatusValidator";
import predictions from "../../db/queries/predictions";
import { PredictionLifeCycle } from "../../types/predicitions";
import responseUtils_deprecated from "../../utils/response";
import { getDbClient } from "../../middleware/deprecated/getDbClient";
import { ErrorCode } from "../../types/responses";
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

    if (!req.prediction || !req.dbClient) {
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

    // Verify prediction is owned by updater
    if (req.prediction.predictor.discord_id !== discord_id) {
      return res
        .status(403)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.AUTHENTICATION_ERROR,
            "This prediction does not belong to you.",
            null
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

    const dueDate = new Date(
      req.prediction.due_date ?? req.prediction.check_date ?? ""
    );
    const effectiveExpiryWindow = isAfter(expiryWindow, dueDate)
      ? dueDate
      : expiryWindow;

    if (isAfter(now, effectiveExpiryWindow)) {
      return res
        .status(403)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.BAD_REQUEST,
            "This prediction is past the retirement window. It is locked and cannot be retired.",
            null
          )
        );
    }

    return predictions
      .retirePredictionById(req.dbClient)(req.prediction.id)
      .then(() => {
        if (!req.prediction || !req.dbClient) {
          throw new Error("Prediction or DB client is not defined");
        }
        return predictions.getPredictionById(req.dbClient)(req.prediction.id);
      })
      .then((prediction) => {
        if (!prediction) {
          throw new Error("Prediction not found");
        }
        // Notify subscribers
        webhookManager.emit("retired_prediction", prediction);

        return res.json(
          responseUtils_deprecated.writeSuccess(
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
            responseUtils_deprecated.writeError(
              ErrorCode.SERVER_ERROR,
              "There was an error retiring this prediction.",
              null
            )
          );
      });
  }
);

export default router;
