import { Router } from "express";
import { z } from "zod";
import { predictionIdSchema } from "../../validations";
import { Route } from "../../utils/routerMap";
import predictions from "../../queries/predictions";
import { getDbClient } from "../../../middleware/getDbClient";
import responseUtils from "../../utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";
import validate from "express-zod-safe";
import { EventManager } from "../../../classes/EventManager";

const RequestSchema = {
  params: z.object({
    prediction_id: predictionIdSchema,
  }),
};

export const untriggerPredictionById: Route = (router: Router) => {
  router.delete(
    "/:prediction_id/trigger",
    validate(RequestSchema),
    getDbClient,
    async (req, res) => {
      const { prediction_id } = req.params;

      predictions
        .untriggerById(req.dbClient)(prediction_id)
        .then(() => predictions.getById(req.dbClient)(prediction_id))
        .then((prediction) => {
          if (!prediction) {
            return res.status(404).json(
              responseUtils.writeErrors([
                {
                  errorCode: API.Errors.NOT_FOUND,
                  message: `Prediction with id ${prediction_id} does not exist.`,
                },
              ])
            );
          }

          // Log Event
          EventManager.emit("untriggered_prediction", prediction);

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
                errorCode: API.Errors.SERVER_ERROR,
                message: "There was an error untriggering this prediction.",
              },
            ])
          );
        });
    }
  );
};
