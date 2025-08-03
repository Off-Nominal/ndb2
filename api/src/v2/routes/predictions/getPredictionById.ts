import { z } from "zod";
import { predictionIdSchema } from "../../validations";
import { Route } from "../../utils/routerMap";
import { getDbClient } from "../../../middleware/getDbClient";
import validate from "express-zod-safe";
import responseUtils from "../../utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";
import { addLocalContext } from "../../../middleware/addLocalContext";
import { getPrediction } from "../../../middleware/getPrediction";

const validator = validate({
  handler: (errors, req, res, next) => {
    const errorInfos = responseUtils.handleValidationErrors(errors);

    if (errorInfos.length > 0) {
      // Validation errors - return 400 Bad Request
      res.status(400).json(responseUtils.writeErrors(errorInfos));
    } else {
      // Non-validation errors - return 500 Internal Server Error
      console.error("Zod Validation Handler run without any errors.");
      console.error(errors);

      res.status(500).json(
        responseUtils.writeErrors([
          {
            code: API.Errors.SERVER_ERROR,
            message: "There was an error processing your request.",
          },
        ])
      );
    }
  },
  params: z.object({
    prediction_id: predictionIdSchema,
  }),
  body: z.any(),
  query: z.any(),
});

export const getPredictionById: Route = (router) => {
  router.get(
    "/:prediction_id",
    validator,
    addLocalContext([getDbClient, getPrediction]),
    async (req, res) => {
      return res.json(
        responseUtils.writeSuccess(res.locals.prediction, "Prediction fetched.")
      );
    }
  );
};
