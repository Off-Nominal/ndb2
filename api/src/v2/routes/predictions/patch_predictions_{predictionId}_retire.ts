import { Router } from "express";
import { z } from "zod";
import { add, isAfter } from "date-fns";
import { predictionIdSchema } from "../../validations";
import { Route } from "../../utils/routerMap";
import predictions from "../../queries/predictions";
import responseUtils from "../../utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";
import { validate } from "../../middleware/validate";
import { getDbClient } from "../../utils/getDbClient";
import { eventsManager } from "../../managers/events";
import GAME_MECHANICS from "../../../config/game_mechanics";

export const retirePredictionById: Route = (router: Router) => {
  router.patch(
    "/:prediction_id/retire",
    validate({
      params: z.object({
        prediction_id: predictionIdSchema,
      }),
      body: z.object({
        discord_id: z.string(),
      }),
    }),
    async (req, res) => {
      const { prediction_id } = req.params;
      const { discord_id } = req.body;

      const dbClient = await getDbClient(res);

      // Fetch prediction
      const prediction = await predictions.getById(dbClient)(prediction_id);

      // Check if prediction exists
      if (!prediction) {
        return res.status(404).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.PREDICTION_NOT_FOUND,
              message: `Prediction with id ${prediction_id} does not exist.`,
            },
          ])
        );
      }

      // Check if prediction is open
      if (prediction.status !== "open") {
        return res.status(400).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.INVALID_PREDICTION_STATUS,
              message: "Predictions must be open to be retired.",
            },
          ])
        );
      }

      // Verify prediction is owned by updater
      if (prediction.predictor.discord_id !== discord_id) {
        return res.status(403).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.INVALID_PREDICTION_OWNERSHIP,
              message: "This prediction does not belong to you.",
            },
          ])
        );
      }

      // Verify that prediction retirement is within allowable time window
      // Predictions cannot be retired after their specified window, or
      // the due date, which ever comes first
      const now = new Date();
      const expiryWindow = add(new Date(prediction.created_date), {
        hours: GAME_MECHANICS.predictionUpdateWindow,
      });

      const dueDate = new Date(
        prediction.due_date ?? prediction.check_date ?? ""
      );
      const effectiveExpiryWindow = isAfter(expiryWindow, dueDate)
        ? dueDate
        : expiryWindow;

      if (isAfter(now, effectiveExpiryWindow)) {
        return res.status(403).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.INVALID_PREDICTION_RETIREMENT_WINDOW,
              message:
                "This prediction is past the retirement window. It is locked and cannot be retired.",
            },
          ])
        );
      }

      // Retire prediction
      await predictions.retireById(dbClient)(prediction_id);

      // Get updated prediction for response
      const retiredPrediction = await predictions.getById(dbClient)(
        prediction_id
      );
      if (!retiredPrediction) {
        return res.status(404).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.PREDICTION_NOT_FOUND,
              message: `Prediction with id ${prediction_id} does not exist.`,
            },
          ])
        );
      }

      // Emit event
      eventsManager.emit("retired_prediction", retiredPrediction);

      // Send response
      return res.json(
        responseUtils.writeSuccess(
          retiredPrediction,
          "Prediction retired successfully."
        )
      );
    }
  );
};
