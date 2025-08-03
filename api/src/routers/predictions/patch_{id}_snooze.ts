import { isAfter, isBefore } from "date-fns";
import express, { Request, Response } from "express";
import webhookManager from "../../config/webhook_subscribers";
import dateValidator from "../../middleware/deprecated/dateValidator";
import { getDbClient } from "../../middleware/deprecated/getDbClient";
import { getPrediction } from "../../middleware/deprecated/getPrediction";
import { getUserByDiscordId } from "../../middleware/deprecated/getUserByDiscordId";
import paramValidator from "../../middleware/deprecated/paramValidator";
import predictionStatusValidator from "../../middleware/deprecated/predictionStatusValidator";
import predictions from "../../db/queries/predictions";
import { PredictionLifeCycle } from "../../types/predicitions";
import responseUtils_deprecated from "../../utils/response";
import { ErrorCode } from "../../types/responses";

const router = express.Router();

router.patch(
  "/:prediction_id/snooze",
  [
    dateValidator.isValid("check_date"),
    dateValidator.isFuture("check_date"),
    paramValidator.numberParseableString("discord_id", { type: "body" }),
    paramValidator.integerParseableString("prediction_id", { type: "params" }),
    paramValidator.isPostgresInt("prediction_id", { type: "params" }),
    getDbClient,
    getUserByDiscordId,
    getPrediction,
    predictionStatusValidator([
      PredictionLifeCycle.OPEN,
      PredictionLifeCycle.CHECKING,
    ]),
  ],
  async (req: Request, res: Response) => {
    const { check_date } = req.body;
    const checkDate = new Date(check_date);

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

    if (!isAfter(checkDate, req.prediction.created_date)) {
      return res
        .status(400)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.BAD_REQUEST,
            "Check date must be after the prediction was created.",
            null
          )
        );
    }

    return predictions
      .setCheckDateByPredictionId(req.dbClient)(req.prediction.id, {
        date: checkDate,
      })
      .then(() => {
        if (!req.prediction || !req.dbClient) {
          throw new Error("Prediction or DB client is not defined");
        }
        return predictions.getPredictionById(req.dbClient)(req.prediction.id);
      })
      .then((prediction) => {
        if (!req.prediction || !req.prediction.check_date || !prediction) {
          throw new Error("Prediction is not defined");
        }
        // Notify Subscribers
        const oldCheckDate = new Date(req.prediction.check_date);
        webhookManager.emit("prediction_edit", prediction, {
          check_date: { old: oldCheckDate, new: checkDate },
        });
        webhookManager.emit("snoozed_prediction", prediction);

        return res.json(
          responseUtils_deprecated.writeSuccess(
            prediction,
            "Prediction triggered successfully."
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
              "There was an error triggering this prediction.",
              null
            )
          );
      });
  }
);

export default router;
