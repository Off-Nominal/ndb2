import express, { Request, Response } from "express";
import webhookManager from "../../config/webhook_subscribers";
import paramValidator from "../../middleware/paramValidator";
import { getPrediction } from "../../middleware/getPrediction";
import { getUserByDiscordId } from "../../middleware/getUserByDiscordId";
import predictionStatusValidator from "../../middleware/predictionStatusValidator";
import predictions from "../../queries/predictions";
import votes from "../../queries/votes";
import { PredictionLifeCycle } from "../../types/predicitions";
import responseUtils from "../../utils/response";
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

    const existingVote = req.prediction.votes.find(
      (vote) => vote.voter.discord_id === discord_id
    );

    if (existingVote?.vote === vote) {
      return res
        .status(200)
        .json(
          responseUtils.writeSuccess(
            req.prediction,
            `You already voted ${
              existingVote.vote === true ? "'yes'" : "'no'"
            } on this prediction, no change necessary.`
          )
        );
    }

    return votes
      .add(req.dbClient)(req.user_id, req.prediction.id, vote)
      .then((v) => predictions.getByPredictionId(req.dbClient)(v.prediction_id))
      .then((prediction) => {
        // Notify Subscribers
        webhookManager.emit("new_vote", prediction);

        const message = !!existingVote
          ? `Vote successfully changed from ${
              existingVote.vote === true ? "'yes' to 'no'" : "'no' to 'yes'"
            }.`
          : `${vote === true ? "'Yes'" : "'No'"} vote added successfully.`;

        return res.json(responseUtils.writeSuccess(prediction, message));
      })
      .catch((err) => {
        console.error(err);
        return res
          .status(500)
          .json(
            responseUtils.writeError(
              ErrorCode.SERVER_ERROR,
              "There was an error updating this vote."
            )
          );
      });
  }
);

export default router;
