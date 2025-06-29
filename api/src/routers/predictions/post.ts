import express, { Request, Response } from "express";
import webhookManager from "../../config/webhook_subscribers";
import bets from "../../db/queries/bets";
import predictions from "../../db/queries/predictions";
import responseUtils_deprecated from "../../utils/response";
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
    if (!req.user_id || !req.dbClient) {
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

    const { text, due_date, check_date } = req.body;

    if (due_date !== undefined && check_date !== undefined) {
      return res
        .status(400)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.MALFORMED_BODY_DATA,
            "Due date and check date cannot be set simultaneously.",
            null
          )
        );
    }

    if (due_date == undefined && check_date == undefined) {
      return res
        .status(400)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.MALFORMED_BODY_DATA,
            "Must have either a due date or a check date.",
            null
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
      .then((p) => {
        if (!req.dbClient || !req.user_id) {
          throw new Error("DB client is not defined");
        }

        return bets.add(req.dbClient)(req.user_id, p.id, true, created_date);
      })
      .then((b) => {
        if (!req.dbClient || !req.user_id) {
          throw new Error("DB client is not defined");
        }
        return predictions.getPredictionById(req.dbClient)(b.prediction_id);
      })
      .then((ep) => {
        if (!ep) {
          throw new Error("Prediction not found");
        }

        res.json(
          responseUtils_deprecated.writeSuccess(
            ep,
            "Prediction created successfully."
          )
        );
        // Notify subscribers
        webhookManager.emit("new_prediction", ep);
      })
      .catch((err) => {
        console.error(err);
        res
          .status(500)
          .json(
            responseUtils_deprecated.writeError(
              ErrorCode.SERVER_ERROR,
              "Error Adding prediction",
              null
            )
          );
      });
  }
);

export default router;
