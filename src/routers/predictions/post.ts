import express, { Request, Response } from "express";
import webhookManager from "../../config/webhook_subscribers";
import bets from "../../db/queries/bets";
import predictions from "../../db/queries/predictions";
import responseUtils from "../../utils/response";
import paramValidator from "../../middleware/paramValidator";
import dateValidator from "../../middleware/dateValidator";
import { getUserByDiscordId } from "../../middleware/getUserByDiscordId";
import { getDbClient } from "../../middleware/getDbClient";
import { ErrorCode } from "../../types/responses";
import { PredictionDriver } from "../../types/predicitions";
const router = express.Router();

router.post(
  "/",
  [
    paramValidator.string("text", { type: "body" }),
    paramValidator.numberParseableString("discord_id", { type: "body" }),
    dateValidator.isValid("due_date", { optional: true }),
    dateValidator.isFuture("due_date", { optional: true }),
    dateValidator.isValid("check_date", { optional: true }),
    dateValidator.isFuture("check_date", { optional: true }),
    getDbClient,
    getUserByDiscordId,
  ],
  async (req: Request, res: Response) => {
    const { text, due_date, check_date } = req.body;

    if (due_date !== undefined && check_date !== undefined) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            ErrorCode.MALFORMED_BODY_DATA,
            "Due date and check date cannot be set simultaneously."
          )
        );
    }

    if (due_date == undefined && check_date == undefined) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            ErrorCode.MALFORMED_BODY_DATA,
            "Must have either a due date or a check date."
          )
        );
    }

    let driver: PredictionDriver = "date";
    let drive_date: Date = new Date(due_date);

    if (check_date !== undefined) {
      driver = "event";
      drive_date = new Date(check_date);
    }

    // Add prediction
    const created_date = new Date();

    predictions
      .add(req.dbClient)(
        req.user_id,
        text,
        new Date(drive_date),
        created_date,
        driver
      )
      .then((p) =>
        bets.add(req.dbClient)(req.user_id, p.id, true, created_date)
      )
      .then((b) => predictions.getPredictionById(req.dbClient)(b.prediction_id))
      .then((ep) => {
        res.json(
          responseUtils.writeSuccess(ep, "Prediction created successfully.")
        );
        // Notify subscribers
        webhookManager.emit("new_prediction", ep);
      })
      .catch((err) => {
        console.error(err);
        res
          .status(500)
          .json(
            responseUtils.writeError(
              ErrorCode.SERVER_ERROR,
              "Error Adding prediction"
            )
          );
      });
  }
);

export default router;
