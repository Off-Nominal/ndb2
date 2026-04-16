import { Router } from "express";
import { z } from "zod";
import { isAfter, isBefore } from "date-fns";
import { discordIdSchema, predictionIdSchema } from "../../validations";
import { Route } from "../../utils/routerMap";
import predictions from "../../../../data/queries/predictions";
import users from "../../../../data/queries/users";
import responseUtils from "../../utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";
import { validate } from "../../middleware/validate";
import { getDbClient } from "../../../../data/db/getDbClient";
import { eventsManager } from "../../../../domain/events/eventsManager";
import { wrapRouteWithErrorBoundary } from "../../middleware/errorHandler";

const triggerPredictionBodySchema = z.object({
  discord_id: discordIdSchema,
  closed_date: z.iso
    .datetime({
      message:
        "Property 'closed_date' must be a valid ISO 8601 datetime string when provided",
    })
    .transform((s) => new Date(s))
    .optional(),
});

export const triggerPredictionById: Route = (router: Router) => {
  router.post(
    "/:prediction_id/trigger",
    validate({
      params: z.object({
        prediction_id: predictionIdSchema,
      }),
      body: triggerPredictionBodySchema,
    }),
    wrapRouteWithErrorBoundary(async (req, res) => {
      const { prediction_id } = req.params;
      const { discord_id, closed_date: bodyClosedDate } = req.body;

      const dbClient = await getDbClient(res);

      const user = await users.getByDiscordId(dbClient)(discord_id);
      const closedDate = bodyClosedDate ?? new Date();

      if (bodyClosedDate && isAfter(closedDate, new Date())) {
        return res.status(400).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.INVALID_PREDICTION_CLOSED_DATE,
              message: "Closed date cannot be in the future.",
            },
          ]),
        );
      }

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

      if (prediction.status !== "open" && prediction.status !== "checking") {
        return res.status(400).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.INVALID_PREDICTION_STATUS,
              message:
                "Predictions must be open or checking to be triggered.",
            },
          ]),
        );
      }

      if (isBefore(closedDate, new Date(prediction.created_date))) {
        return res.status(400).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.INVALID_PREDICTION_CLOSED_DATE,
              message:
                "Closed date cannot be before prediction's created date.",
            },
          ]),
        );
      }

      const priorStatus = prediction.status;

      await predictions.closeByTriggerer(dbClient)(
        prediction_id,
        user.id,
        closedDate,
      );

      const updated = await predictions.getById(dbClient)(prediction_id);
      if (!updated) {
        throw new Error("Prediction not found after trigger");
      }

      if (priorStatus === "checking") {
        eventsManager.emit("triggered_snooze_check", updated);
      } else {
        eventsManager.emit("triggered_prediction", updated);
      }

      return res.json(
        responseUtils.writeSuccess(
          updated,
          "Prediction triggered successfully.",
        ),
      );
    }),
  );
};
