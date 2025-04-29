import { Router } from "express";
import { z } from "zod";
import { predictionIdSchema } from "../../validations";
import { NDB2Route } from "../../utils/routerMap";
import predictions from "../../queries/predictions";
import { getDbClient } from "../../../middleware/getDbClient";
import responseUtils from "../../../utils/response";
import { ErrorCode } from "../../../types/responses";
import webhookManager from "../../../config/webhook_subscribers";
import validate from "express-zod-safe";

const RequestSchema = {
  params: z.object({
    prediction_id: predictionIdSchema,
  }),
};

export const untriggerPredictionById: NDB2Route = (router: Router) => {
  router.delete(
    "/:prediction_id/trigger",
    [validate({ params: RequestSchema }), getDbClient],
    async (req, res) => {
      const { prediction_id } = req.params;

      predictions
        .untriggerById(req.dbClient)(prediction_id)
        .then(() => predictions.getById(req.dbClient)(prediction_id))
        .then((prediction) => {
          // Notify Subscribers
          webhookManager.emit("untriggered_prediction", prediction);

          const response = responseUtils.writeSuccess(
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
              responseUtils.writeError(
                ErrorCode.SERVER_ERROR,
                "There was an error untriggering this prediction."
              )
            );
        });
    }
  );
};
