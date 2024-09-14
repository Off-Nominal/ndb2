import { isBefore } from "date-fns";
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

router.post(
  "/:prediction_id/trigger",
  [
    dateValidator.isValid("closed_date", { optional: true }),
    dateValidator.isPast("closed_date", { optional: true }),
    paramValidator.numberParseableString("discord_id", { type: "body" }),
    paramValidator.integerParseableString("prediction_id", { type: "params" }),
    paramValidator.isPostgresInt("prediction_id", { type: "params" }),
    getDbClient,
    getUserByDiscordId,
    getPrediction,
    predictionStatusValidator(PredictionLifeCycle.OPEN),
  ],
  async (req: Request, res: Response) => {
    const { closed_date } = req.body;
    const closedDate = new Date(closed_date);

    if (closed_date) {
      // Verify closed date is after prediction's creation date
      if (isBefore(closedDate, new Date(req.prediction.created_date))) {
        return res
          .status(400)
          .json(
            responseUtils.writeError(
              ErrorCode.BAD_REQUEST,
              "Closed date cannot be before prediction's created date"
            )
          );
      }
    }

    return predictions
      .closePredictionById(req.dbClient)(
        req.prediction.id,
        req.user_id,
        closed_date ? closedDate : new Date()
      )
      .then(() =>
        predictions.getPredictionById(req.dbClient)(req.prediction.id)
      )
      .then((prediction) => {
        // Notify Subscribers
        webhookManager.emit("triggered_prediction", prediction);

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
