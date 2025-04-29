import { isAfter, isBefore } from "date-fns";
import express, { Request, Response } from "express";
import webhookManager from "../../config/webhook_subscribers";
import dateValidator from "../../middleware/dateValidator";
import { getDbClient } from "../../middleware/getDbClient";
import { getPrediction } from "../../middleware/getPrediction";
import { getUserByDiscordId } from "../../middleware/getUserByDiscordId";
import paramValidator from "../../middleware/paramValidator";
import predictionStatusValidator from "../../middleware/predictionStatusValidator";
import predictions from "../../db/queries/predictions";
import { PredictionLifeCycle } from "../../types/predicitions";
import responseUtils from "../../utils/response";
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

    if (!isAfter(checkDate, req.prediction.created_date)) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            ErrorCode.BAD_REQUEST,
            "Check date must be after the prediction was created."
          )
        );
    }

    return predictions
      .setCheckDateByPredictionId(req.dbClient)(req.prediction.id, {
        date: checkDate,
      })
      .then(() =>
        predictions.getPredictionById(req.dbClient)(req.prediction.id)
      )
      .then((prediction) => {
        // Notify Subscribers
        const oldCheckDate = new Date(req.prediction.check_date);
        webhookManager.emit("prediction_edit", prediction, {
          check_date: { old: oldCheckDate, new: checkDate },
        });
        webhookManager.emit("snoozed_prediction", prediction);

        return res.json(
          responseUtils.writeSuccess(
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
            responseUtils.writeError(
              ErrorCode.SERVER_ERROR,
              "There was an error triggering this prediction."
            )
          );
      });
  }
);

export default router;
