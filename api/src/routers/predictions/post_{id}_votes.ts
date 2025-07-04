import express, { Request, Response } from "express";
import webhookManager from "../../config/webhook_subscribers";
import paramValidator from "../../middleware/paramValidator";
import { getPrediction } from "../../middleware/getPrediction";
import { getUserByDiscordId } from "../../middleware/getUserByDiscordId";
import predictionStatusValidator from "../../middleware/predictionStatusValidator";
import predictions from "../../db/queries/predictions";
import votes from "../../db/queries/votes/index.ts";
import { PredictionLifeCycle } from "../../types/predicitions";
import responseUtils_deprecated from "../../utils/response";
import { getDbClient } from "../../middleware/getDbClient";
import { ErrorCode } from "../../types/responses";
const router = express.Router();

router.post(
  "/:prediction_id/votes",
  [
    paramValidator.boolean("vote", { type: "body" }),
    paramValidator.numberParseableString("discord_id", { type: "body" }),
    paramValidator.integerParseableString("prediction_id", { type: "params" }),
    paramValidator.isPostgresInt("prediction_id", { type: "params" }),
    getDbClient,
    getUserByDiscordId,
    getPrediction,
    predictionStatusValidator(PredictionLifeCycle.CLOSED),
  ],
  async (req: Request, res: Response) => {
    const { discord_id, vote } = req.body;

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

    const existingVote = req.prediction.votes.find(
      (vote) => vote.voter.discord_id === discord_id
    );

    if (existingVote?.vote === vote) {
      return res
        .status(200)
        .json(
          responseUtils_deprecated.writeSuccess(
            req.prediction,
            `You already voted ${
              existingVote?.vote === true ? "'yes'" : "'no'"
            } on this prediction, no change necessary.`
          )
        );
    }

    return votes
      .add(req.dbClient)(req.user_id, req.prediction.id, vote)
      .then((v) => {
        if (!req.dbClient) {
          throw new Error("Database client is not available");
        }

        return predictions.getPredictionById(req.dbClient)(v.prediction_id);
      })
      .then((prediction) => {
        if (!prediction) {
          throw new Error("Prediction not found");
        }
        // Notify Subscribers
        webhookManager.emit("new_vote", prediction);

        const message = !!existingVote
          ? `Vote successfully changed from ${
              existingVote.vote === true ? "'yes' to 'no'" : "'no' to 'yes'"
            }.`
          : `${vote === true ? "'Yes'" : "'No'"} vote added successfully.`;

        return res.json(
          responseUtils_deprecated.writeSuccess(prediction, message)
        );
      })
      .catch((err) => {
        console.error(err);
        return res
          .status(500)
          .json(
            responseUtils_deprecated.writeError(
              ErrorCode.SERVER_ERROR,
              "There was an error updating this vote.",
              null
            )
          );
      });
  }
);

export default router;
