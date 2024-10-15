import express, { Request, Response } from "express";
import webhookManager from "../../config/webhook_subscribers";
import paramValidator from "../../middleware/paramValidator";
import { getPrediction } from "../../middleware/getPrediction";
import { fetchUser } from "../../middleware/fetchUser";
import predictionStatusValidator from "../../middleware/predictionStatusValidator";
import predictions from "../../db/oldQueries/predictions";
import { PredictionLifeCycle } from "../../types/predicitions";
import responseUtils from "../../utils/response";
import { getDbClient } from "../../middleware/getDbClient";
import { ErrorCode } from "../../types/responses";
import { votes } from "../../db/queries/votes";
const router = express.Router();

router.post(
  "/:prediction_id/votes",
  [
    paramValidator.boolean("vote", { type: "body" }),
    paramValidator.numberParseableString("discord_id", { type: "body" }),
    paramValidator.integerParseableString("prediction_id", { type: "params" }),
    paramValidator.isPostgresInt("prediction_id", { type: "params" }),
    getDbClient,
    fetchUser,
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
      .add(
        {
          user_id: req.user_id,
          prediction_id: req.prediction.id,
          vote: vote,
        },
        req.dbClient
      )
      .then((v) => {
        console.log(v);
        return predictions.getPredictionById(req.dbClient)(req.prediction.id);
      })
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
