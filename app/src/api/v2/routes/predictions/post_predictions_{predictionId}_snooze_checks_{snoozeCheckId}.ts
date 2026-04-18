import { Router } from "express";
import { z } from "zod";
import {
  discordIdSchema,
  predictionIdSchema,
  snoozeCheckIdSchema,
  snoozeVoteValueSchema,
} from "../../validations";
import { Route } from "@shared/routerMap";
import predictions from "@data/queries/predictions";
import users from "@data/queries/users";
import responseUtils from "../../utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";
import { validate } from "../../middleware/validate";
import { getDbClient } from "@data/db/getDbClient";
import { eventsManager } from "@domain/events/eventsManager";
import { wrapRouteWithErrorBoundary } from "../../middleware/errorHandler";
import snoozeVotes from "@data/queries/snooze_votes";

export const postPredictionSnoozeCheckVote: Route = (router: Router) => {
  router.post(
    "/:prediction_id/snooze_checks/:snooze_check_id",
    validate({
      params: z.object({
        prediction_id: predictionIdSchema,
        snooze_check_id: snoozeCheckIdSchema,
      }),
      body: z.object({
        discord_id: discordIdSchema,
        value: snoozeVoteValueSchema,
      }),
    }),
    wrapRouteWithErrorBoundary(async (req, res) => {
      const { prediction_id, snooze_check_id } = req.params;
      const { discord_id, value } = req.body;

      const dbClient = await getDbClient(res);

      const user = await users.getByDiscordId(dbClient)(discord_id);

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

      if (prediction.status !== "checking") {
        return res.status(400).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.INVALID_PREDICTION_STATUS,
              message: "Snooze votes can only be cast on checking predictions.",
            },
          ]),
        );
      }

      const check = prediction.checks.find((c) => c.id === snooze_check_id);

      if (!check) {
        return res.status(400).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.SNOOZE_CHECK_NOT_FOUND,
              message: "Snooze check is not associated with this prediction.",
            },
          ]),
        );
      }

      if (check.closed) {
        return res.status(400).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.SNOOZE_CHECK_CLOSED,
              message: "Snooze check is not open anymore.",
            },
          ]),
        );
      }

      await snoozeVotes.addVote(dbClient)(snooze_check_id, user.id, value);

      const updated = await predictions.getById(dbClient)(prediction_id);
      if (!updated) {
        throw new Error("Prediction not found after snooze vote");
      }

      eventsManager.emit("new_snooze_vote", updated);

      if (updated.status === "open") {
        eventsManager.emit("snoozed_prediction", updated);
      }

      return res.json(
        responseUtils.writeSuccess(
          updated,
          "Snooze vote updated successfully.",
        ),
      );
    }),
  );
};
