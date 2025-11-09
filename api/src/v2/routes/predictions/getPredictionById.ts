import { z } from "zod";
import { predictionIdSchema } from "../../validations";
import { Route } from "../../utils/routerMap";
import responseUtils from "../../utils/response";
import { validate } from "../../middleware/validate";
import predictions from "../../queries/predictions";
import * as API from "@offnominal/ndb2-api-types/v2";
import { getDbClient } from "../../middleware/getDbClient";

export const getPredictionById: Route = (router) => {
  router.get(
    "/:prediction_id",
    validate({
      params: z.object({
        prediction_id: predictionIdSchema,
      }),
    }),
    async (req, res) => {
      const { prediction_id } = req.params;

      const dbClient = await getDbClient(res);

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
        responseUtils.writeSuccess(prediction, "Prediction fetched.")
      );
    }
  );
};
