import { isBefore } from "date-fns";
import express, { Request, Response } from "express";
import webhookManager from "../../config/webhook_subscribers";
import bodyValidator from "../../middleware/bodyValidator";
import dateValidator from "../../middleware/dateValidator";
import { getPrediction } from "../../middleware/getPrediction";
import predictionStatusValidator from "../../middleware/predictionStatusValidator";
import predictions from "../../queries/predictions";
import users from "../../queries/users";
import votes from "../../queries/votes";
import { PredictionLifeCycle } from "../../types/predicitions";
import responseUtils from "../../utils/response";
const router = express.Router();

router.post(
  "/:prediction_id/votes",
  [
    bodyValidator.numberParseableString("discord_id"),
    bodyValidator.boolean("vote"),
    getPrediction,
    predictionStatusValidator(PredictionLifeCycle.CLOSED),
  ],
  async (req: Request, res: Response) => {
    const { discord_id, vote } = req.body;

    // Verify user has not already voted
    if (
      req.prediction.votes.find((vote) => vote.voter.discord_id === discord_id)
    ) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            "BAD_REQUEST",
            "User has already voted on this prediction."
          )
        );
    }

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

    return votes
      .add(userId, req.prediction.id, vote)
      .then((v) => predictions.getByPredictionId(v.prediction_id))
      .then((prediction) => {
        // Notify Subscribers
        webhookManager.emit("new_vote", prediction);

        return res.json(
          responseUtils.writeSuccess(prediction, "Voted logged successfully.")
        );
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
      });
  }
);

export default router;
