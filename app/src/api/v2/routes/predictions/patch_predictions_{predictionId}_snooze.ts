import { Router } from "express";
import { z } from "zod";
import { isAfter } from "date-fns";
import {
  createFutureDateSchema,
  discordIdSchema,
  predictionIdSchema,
} from "../../validations";
import { Route } from "@shared/routerMap";
import predictions from "@data/queries/predictions";
import users from "@data/queries/users";
import responseUtils from "../../utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";
import { validate } from "../../middleware/validate";
import { getDbClient } from "@data/db/getDbClient";
import { eventsManager } from "@domain/events/events-manager";
import { wrapRouteWithErrorBoundary } from "../../middleware/errorHandler";

export const patchPredictionSnooze: Route = (router: Router) => {
  router.patch(
    "/:prediction_id/snooze",
    validate({
      params: z.object({
        prediction_id: predictionIdSchema,
      }),
      body: z.object({
        discord_id: discordIdSchema,
        check_date: createFutureDateSchema({ fieldName: "check_date" }),
      }),
    }),
    wrapRouteWithErrorBoundary(async (req, res) => {
      const { prediction_id } = req.params;
      const checkDate = req.body.check_date;

      const dbClient = await getDbClient(res);

      // Ensures there us a user in the DB for the discord_id
      await users.getByDiscordId(dbClient)(req.body.discord_id);

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

      if (prediction.driver !== "event") {
        return res.status(400).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.INVALID_PREDICTION_DRIVER,
              message:
                "Check date can only be updated on event driven predictions.",
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
                "Check date can only be updated on open or checking predictions.",
            },
          ]),
        );
      }

      if (!isAfter(checkDate, new Date(prediction.created_date))) {
        return res.status(400).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.INVALID_PREDICTION_CHECK_DATE,
              message: "Check date must be after the prediction was created.",
            },
          ]),
        );
      }

      const oldCheckDate = prediction.check_date;

      await predictions.setCheckDateByPredictionId(dbClient)(
        prediction_id,
        checkDate,
      );

      const updated = await predictions.getById(dbClient)(prediction_id);
      if (!updated) {
        throw new Error("Prediction not found after updating check date");
      }

      eventsManager.emit("prediction_edit", updated, {
        check_date: {
          old: oldCheckDate,
          new: checkDate.toISOString(),
        },
      });
      eventsManager.emit("snoozed_prediction", updated);

      return res.json(
        responseUtils.writeSuccess(
          updated,
          "Prediction check date updated successfully.",
        ),
      );
    }),
  );
};
