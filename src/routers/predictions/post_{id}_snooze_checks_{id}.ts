import express, { Request, Response } from "express";
import { PredictionLifeCycle } from "../../types/predicitions";
import predictionStatusValidator from "../../middleware/predictionStatusValidator";
import paramValidator from "../../middleware/paramValidator";
import { getDbClient } from "../../middleware/getDbClient";
import { getUserByDiscordId } from "../../middleware/getUserByDiscordId";
import { getPrediction } from "../../middleware/getPrediction";
import { isAllowableSnooze } from "../../types/snoozes";
import responseUtils from "../../utils/response";
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
    const { value } = req.body;
    const { snooze_check_id } = req.params;

    // Verify snooze value is allowed
    if (!isAllowableSnooze(value)) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            ErrorCode.BAD_REQUEST,
            "Invalid snooze value."
          )
        );
    }

    // Verify Snooze Check is associated with this Prediction
    let found = false;
    for (const check of req.prediction.checks) {
      if (check.id === parseInt(snooze_check_id)) {
        found = true;
        break;
      }
    }

    if (!found) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            ErrorCode.BAD_REQUEST,
            "Snooze Check is not associated with this Prediction."
          )
        );
    }

    return snoozes
      .addVote(req.dbClient)(snooze_check_id, req.user_id, value)
      .then((prediction) => {
        // Notify Subscribers
        webhookManager.emit("new_snooze_vote", prediction);

        if (prediction.status === PredictionLifeCycle.CLOSED) {
          webhookManager.emit("triggered_prediction", prediction);
        } else if (prediction.check_date !== req.prediction.check_date) {
          webhookManager.emit("snoozed_prediction", prediction);
        }

        return res.json(
          responseUtils.writeSuccess(
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
            responseUtils.writeError(
              ErrorCode.SERVER_ERROR,
              "There was an error adding this snooze vote"
            )
          );
      });
  }
);

export default router;
