import { Router } from "express";
import { z } from "zod";
import { predictionIdSchema } from "../../validations";
import { Route } from "../../utils/routerMap";
import predictions from "../../queries/predictions";
import responseUtils from "../../utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";
import { validate } from "../../middleware/validate";
import { getDbClient } from "../../middleware/getDbClient";

export const untriggerPredictionById: Route = (router: Router) => {
  router.delete(
    "/:prediction_id/trigger",
    validate({
      params: z.object({
        prediction_id: predictionIdSchema,
      }),
    }),
    async (req, res) => {
      const { prediction_id } = req.params;

      const dbClient = await getDbClient(res);

      // Check if prediction exists
      const predictionExists = await predictions.existsById(dbClient)(
        prediction_id
      );
      if (!predictionExists) {
        return res.status(404).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.PREDICTION_NOT_FOUND,
              message: `Prediction with id ${prediction_id} does not exist.`,
            },
          ])
        );
      }

      // Check if prediction is closed
      const isAllowedStatus = await predictions.isOfStatus(dbClient)(
        prediction_id,
        ["closed"]
      );

      if (isAllowedStatus === false) {
        return res.status(400).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.INVALID_PREDICTION_STATUS,
              message: "Predictions must be closed to be untriggered.",
            },
          ])
        );
      }

      // Untrigger prediction
      await predictions.untriggerById(dbClient)(prediction_id);

      // Get prediction for response
      const prediction = await predictions.getById(dbClient)(prediction_id);
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

      // Send response
      return res.json(
        responseUtils.writeSuccess(
          prediction,
          "Prediction untriggred successfully."
        )
      );
    }
  );
};
