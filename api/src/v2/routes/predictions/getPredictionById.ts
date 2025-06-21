import { z } from "zod";
import { predictionIdSchema } from "../../validations";
import { Route } from "../../utils/routerMap";
import predictions from "../../queries/predictions";
import { getDbClient } from "../../../middleware/getDbClient";
import validate from "express-zod-safe";
import responseUtils from "../../utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";

const validator = validate({
  handler: (errors, req, res, next) => {
    const errorInfos = responseUtils.handleValidationErrors(errors);

    if (errorInfos.length > 0) {
      // Validation errors - return 400 Bad Request
      res.status(400).json(responseUtils.writeErrors(errorInfos));
    } else {
      // Non-validation errors - return 500 Internal Server Error
      res.status(500).json(
        responseUtils.writeErrors([
          {
            errorCode: API.Errors.SERVER_ERROR,
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

export const getPredictionById: Route = (router) => {
  router.get("/:prediction_id", validator, getDbClient, async (req, res) => {
    const { prediction_id } = req.params;

    predictions
      .getById(req.dbClient)(prediction_id)
      .then((prediction) => {
        if (!prediction) {
          return res.status(404).json(
            responseUtils.writeErrors([
              {
                errorCode: API.Errors.NOT_FOUND,
                message: `Predicton with id ${prediction_id} does not exist.`,
              },
            ])
          );
        }

        res.json(
          responseUtils.writeSuccess(
            prediction,
            "Prediction fetched successfully."
          )
        );
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json(
          responseUtils.writeErrors([
            {
              errorCode: API.Errors.SERVER_ERROR,
              message: "Unable to fetch prediction.",
            },
          ])
        );
      });
  });
};
