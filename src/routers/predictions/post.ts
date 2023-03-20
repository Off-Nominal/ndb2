import express, { Request, Response } from "express";
import webhookManager from "../../config/webhook_subscribers";
import bets from "../../queries/bets";
import predictions from "../../queries/predictions";
import users from "../../queries/users";
import responseUtils from "../../utils/response";
import bodyValidator from "../../middleware/bodyValidator";
import dateValidator from "../../middleware/dateValidator";
const router = express.Router();

router.post(
  "/",
  [
    bodyValidator.numberParseableString("discord_id"),
    bodyValidator.string("text"),
    dateValidator.isValid("due_date"),
    dateValidator.isFuture("due_date"),
  ],
  async (req: Request, res: Response) => {
    const { discord_id, text, due_date } = req.body;

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

    // Add prediction
    const created_date = new Date();

    predictions
      .add(userId, text, new Date(due_date), created_date)
      .then((p) => bets.add(userId, p.id, true, created_date))
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
