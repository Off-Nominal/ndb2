import { Router } from "express";
import { z } from "zod";
import { predictionIdSchema } from "../../validations";
import { Route } from "../../utils/routerMap";
import predictions from "../../queries/predictions";
import { getDbClient } from "../../../middleware/deprecated/getDbClient";
import responseUtils from "../../utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";
import validate from "express-zod-safe";
import { addLocalContext } from "../../../middleware/addLocalContext";

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
});

export const untriggerPredictionById: Route = (router: Router) => {
  router.delete(
    "/:prediction_id/trigger",
    validator,
    addLocalContext([getDbClient]),
    async (req, res) => {
      const { prediction_id } = req.params;

      // Test type inference - these should be properly typed
      const dbClient = res.locals.dbClient;

      predictions
        .untriggerById(dbClient)(prediction_id)
        .then(() => predictions.getById(dbClient)(prediction_id))
        .then((prediction) => {
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

          const response = responseUtils.writeSuccess(
            prediction,
            "Prediction untriggered successfully."
          );
          res.json(response);
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).json(
            responseUtils.writeErrors([
              {
                code: API.Errors.SERVER_ERROR,
                message: "There was an error untriggering this prediction.",
              },
            ])
          );
        });
    }
  );
};
