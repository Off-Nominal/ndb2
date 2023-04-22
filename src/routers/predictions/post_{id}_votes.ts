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
        .status(400)
        .json(
          responseUtils.writeError(
            "BAD_REQUEST",
            "You already have that vote logged on this prediction, no change necessary."
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
          ? "Voted successfully changed."
          : "Vote added successfully.";

        return res.json(responseUtils.writeSuccess(prediction, message));
      })
      .catch((err) => {
        console.error(err);
        return res
          .status(500)
          .json(
            responseUtils.writeError(
              "SERVER_ERROR",
              "There was an error adding this vote."
            )
          );
      })
      .finally(() => req.dbClient.release());
  }
);

export default router;
