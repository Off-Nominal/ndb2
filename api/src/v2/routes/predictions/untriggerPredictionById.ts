import { Router } from "express";
import { z } from "zod";
import { predictionIdSchema } from "../../validations";
import { Route } from "../../utils/routerMap";
import predictions from "../../queries/predictions";
import { getDbClient } from "../../../middleware/getDbClient";
import responseUtils_deprecated from "../../../utils/response";
import { ErrorCode } from "../../../types/responses";
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
            return res
              .status(404)
              .json(
                responseUtils_deprecated.writeError(
                  ErrorCode.NOT_FOUND,
                  `Prediction with id ${prediction_id} does not exist.`,
                  null
                )
              );
          }

          // Log Event
          EventManager.emit("untriggered_prediction", prediction);

          const response = responseUtils_deprecated.writeSuccess(
            prediction,
            "Prediction untriggered successfully."
          );
          res.json(response);
        })
        .catch((err) => {
          console.error(err);
          return res
            .status(500)
            .json(
              responseUtils_deprecated.writeError(
                ErrorCode.SERVER_ERROR,
                "There was an error untriggering this prediction.",
                null
              )
            );
        });
    }
  );
};
