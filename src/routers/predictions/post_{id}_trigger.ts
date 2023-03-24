import { isBefore } from "date-fns";
import express, { Request, Response } from "express";
import webhookManager from "../../config/webhook_subscribers";
import bodyValidator from "../../middleware/bodyValidator";
import dateValidator from "../../middleware/dateValidator";
import { getPrediction } from "../../middleware/getPrediction";
import predictionStatusValidator from "../../middleware/predictionStatusValidator";
import predictions from "../../queries/predictions";
import users from "../../queries/users";
import { PredictionLifeCycle } from "../../types/predicitions";
import responseUtils from "../../utils/response";
const router = express.Router();

router.post(
  "/:prediction_id/trigger",
  [
    bodyValidator.numberParseableString("discord_id"),
    dateValidator.isValid("closed_date", { optional: true }),
    dateValidator.isPast("closed_date", { optional: true }),
    getPrediction,
    predictionStatusValidator(PredictionLifeCycle.OPEN),
  ],
  async (req: Request, res: Response) => {
    const { discord_id, closed_date } = req.body;

    if (
      isBefore(new Date(closed_date), new Date(req.prediction.created_date))
    ) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            "BAD_REQUEST",
            "Closed date cannot be before prediction's created date"
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

    return predictions
      .closePredictionById(req.prediction.id, userId, closed_date || new Date())
      .then((prediction) => {
        // Notify Subscribers
        // webhookManager.emit("triggered_prediction", prediction);

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
              "SERVER_ERROR",
              "There was an error retiring this prediction."
            )
          );
      });
  }
);

export default router;
