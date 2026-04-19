import { Router } from "express";
import { z } from "zod";
import { discordIdSchema, predictionIdSchema } from "../../validations";
import { Route } from "@shared/routerMap";
import predictions from "@data/queries/predictions";
import votesQueries from "@data/queries/votes";
import users from "@data/queries/users";
import responseUtils from "../../utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";
import { validate } from "../../middleware/validate";
import { getDbClient } from "@data/db/getDbClient";
import { eventsManager } from "@domain/events/events-manager";
import { wrapRouteWithErrorBoundary } from "../../middleware/errorHandler";

export const postPredictionVote: Route = (router: Router) => {
  router.post(
    "/:prediction_id/votes",
    validate({
      params: z.object({
        prediction_id: predictionIdSchema,
      }),
      body: z.object({
        discord_id: discordIdSchema,
        vote: z.boolean({
          message: "Property 'vote' must be a boolean",
        }),
      }),
    }),
    wrapRouteWithErrorBoundary(async (req, res) => {
      const { prediction_id } = req.params;
      const { discord_id, vote } = req.body;

      const dbClient = await getDbClient(res);

      const prediction = await predictions.getById(dbClient)(prediction_id);

      if (!prediction) {
        return res.status(404).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.PREDICTION_NOT_FOUND,
              message: `Prediction with id ${prediction_id} does not exist.`,
            },
          ]),
        );
      }

      if (prediction.status !== "closed") {
        return res.status(400).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.INVALID_PREDICTION_STATUS,
              message: "Votes can only be cast on closed predictions.",
            },
          ]),
        );
      }

      const user = await users.getByDiscordId(dbClient)(discord_id);
      const existingVote = prediction.votes.find(
        (v) => v.voter.discord_id === discord_id,
      );

      if (existingVote?.vote === vote) {
        return res
          .status(200)
          .json(
            responseUtils.writeSuccess(
              prediction,
              `You already voted ${
                existingVote.vote === true ? "'yes'" : "'no'"
              } on this prediction, no change necessary.`,
            ),
          );
      }

      await votesQueries.add(dbClient)({
        user_id: user.id,
        prediction_id,
        vote,
      });

      const updated = await predictions.getById(dbClient)(prediction_id);
      if (!updated) {
        throw new Error("Prediction not found after vote");
      }

      eventsManager.emit("new_vote", updated);

      const message = existingVote
        ? `Vote successfully changed from ${
            existingVote.vote === true ? "'yes' to 'no'" : "'no' to 'yes'"
          }.`
        : `${vote === true ? "'Yes'" : "'No'"} vote added successfully.`;

      return res.json(responseUtils.writeSuccess(updated, message));
    }),
  );
};
