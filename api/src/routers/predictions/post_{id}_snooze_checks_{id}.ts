import express, { Request, Response } from "express";
import { PredictionLifeCycle } from "../../types/predicitions";
import predictionStatusValidator from "../../middleware/deprecated/predictionStatusValidator";
import paramValidator from "../../middleware/deprecated/paramValidator";
import { getDbClient } from "../../middleware/deprecated/getDbClient";
import { getUserByDiscordId } from "../../middleware/deprecated/getUserByDiscordId";
import { getPrediction } from "../../middleware/deprecated/getPrediction";
import { isAllowableSnooze } from "../../types/snoozes";
import responseUtils_deprecated from "../../utils/response";
import { ErrorCode } from "../../types/responses";
import snoozes from "../../db/queries/snoozes";
import webhookManager from "../../config/webhook_subscribers";

const router = express.Router();

router.post(
  "/:prediction_id/snooze_checks/:snooze_check_id",
  [
    paramValidator.numberParseableString("discord_id", { type: "body" }),
    paramValidator.integerParseableString("prediction_id", { type: "params" }),
    paramValidator.isPostgresInt("prediction_id", { type: "params" }),
    paramValidator.integerParseableString("snooze_check_id", {
      type: "params",
    }),
    paramValidator.isPostgresInt("snooze_check_id", { type: "params" }),
    paramValidator.integer("value", { type: "body" }),
    getDbClient,
    getUserByDiscordId,
    getPrediction,
    predictionStatusValidator(PredictionLifeCycle.CHECKING),
  ],
  async (req: Request, res: Response) => {
    if (!req.prediction || !req.dbClient || !req.user_id) {
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
    const { value } = req.body;
    const { snooze_check_id } = req.params;

    // Verify snooze value is allowed
    if (!isAllowableSnooze(value)) {
      return res
        .status(400)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.BAD_REQUEST,
            "Invalid snooze value.",
            null
          )
        );
    }

    // Verify Snooze Check is associated with this Prediction and open
    let found = false;
    let open = false;

    for (const check of req.prediction.checks) {
      if (check.id === parseInt(snooze_check_id)) {
        found = true;
        open = !check.closed;
        break;
      }
    }

    if (!found) {
      return res
        .status(400)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.BAD_REQUEST,
            "Snooze Check is not associated with this Prediction.",
            null
          )
        );
    }

    if (!open) {
      return res
        .status(400)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.BAD_REQUEST,
            "Snooze Check is not open anymore.",
            null
          )
        );
    }

    return snoozes
      .addSnoozeVote(req.dbClient)(snooze_check_id, req.user_id, value)
      .then((prediction) => {
        // Notify Subscribers
        webhookManager.emit("new_snooze_vote", prediction);

        // If the prediction is now open, notify subscribers of a snoozing
        if (prediction.status === PredictionLifeCycle.OPEN) {
          webhookManager.emit("snoozed_prediction", prediction);
        }

        return res.json(
          responseUtils_deprecated.writeSuccess(
            prediction,
            "Snooze vote updated successfully"
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
              "There was an error adding this snooze vote",
              null
            )
          );
      });
  }
);

export default router;
