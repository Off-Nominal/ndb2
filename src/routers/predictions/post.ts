import express, { Request, Response } from "express";
import webhookManager from "../../config/webhook_subscribers";
import bets from "../../queries/bets";
import predictions from "../../queries/predictions";
import responseUtils from "../../utils/response";
import paramValidator from "../../middleware/paramValidator";
import dateValidator from "../../middleware/dateValidator";
import { getUserByDiscordId } from "../../middleware/getUserByDiscordId";
const router = express.Router();

router.post(
  "/",
  [
    paramValidator.string("text", { type: "body" }),
    paramValidator.numberParseableString("discord_id", { type: "body" }),
    dateValidator.isValid("due_date"),
    dateValidator.isFuture("due_date"),
    getUserByDiscordId,
  ],
  async (req: Request, res: Response) => {
    const { text, due_date } = req.body;

    // Add prediction
    const created_date = new Date();

    predictions
      .add(req.user_id, text, new Date(due_date), created_date)
      .then((p) => bets.add(req.user_id, p.id, true, created_date))
      .then((b) => predictions.getByPredictionId(b.prediction_id))
      .then((ep) => {
        // Notify subscribers
        webhookManager.emit("new_prediction", ep);

        res.json(
          responseUtils.writeSuccess(ep, "Prediction created successfully.")
        );
      })
      .catch((err) => {
        console.error(err);
        res
          .status(500)
          .json(
            responseUtils.writeError("SERVER_ERROR", "Error Adding prediction")
          );
      });
  }
);

export default router;
