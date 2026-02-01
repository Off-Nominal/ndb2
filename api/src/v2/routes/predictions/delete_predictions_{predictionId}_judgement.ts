import { Router } from "express";
import { z } from "zod";
import { predictionIdSchema } from "../../validations";
import { Route } from "../../utils/routerMap";
import predictions from "../../queries/predictions";
import seasons from "../../queries/seasons";
import responseUtils from "../../utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";
import { validate } from "../../middleware/validate";
import { getDbClient } from "../../utils/getDbClient";
import { eventsManager } from "../../managers/events";

export const unjudgePredictionById: Route = (router: Router) => {
  router.delete(
    "/:prediction_id/judgement",
    validate({
      params: z.object({
        prediction_id: predictionIdSchema,
      }),
    }),
    async (req, res) => {
      const { prediction_id } = req.params;

      const dbClient = await getDbClient(res);

      // Fetch prediction once
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

      // Check if prediction is judged
      if (
        prediction.status !== "successful" &&
        prediction.status !== "failed"
      ) {
        return res.status(400).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.INVALID_PREDICTION_STATUS,
              message: "Predictions must be judged to be unjudged.",
            },
          ])
        );
      }

      if (prediction.season_id !== null) {
        const season = await seasons.getById(dbClient)(prediction.season_id);

        if (!season) {
          throw new Error("Season not found");
        }

        if (season.closed) {
          return res.status(400).json(
            responseUtils.writeErrors([
              {
                code: API.Errors.INVALID_PREDICTION_STATUS,
                message: "Predictions in closed seasons cannot be unjudged.",
              },
            ])
          );
        }
      }

      // Unjudge prediction
      await predictions.unjudgeById(dbClient)(prediction_id);

      // Get updated prediction for response
      const unjudgedPrediction = await predictions.getById(dbClient)(
        prediction_id
      );
      if (!unjudgedPrediction) {
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
      eventsManager.emit("unjudged_prediction", unjudgedPrediction);

      // Send response
      return res.json(
        responseUtils.writeSuccess(
          unjudgedPrediction,
          "Prediction judgement removed successfully."
        )
      );
    }
  );
};
