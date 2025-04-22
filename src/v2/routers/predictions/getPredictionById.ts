import { Router } from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { predictionIdSchema } from "../../validations";
import { NDB2Route } from "../../utils/routerMap";
import predictions from "../../queries/predictions";
import { getDbClient } from "../../../middleware/getDbClient";
import responseUtils from "../../../utils/response";
import { ErrorCode } from "../../../types/responses";

const RequestSchema = {
  params: z.object({
    prediction_id: predictionIdSchema,
  }),
};

export const getPredictionByIdHandler: NDB2Route = (router: Router) => {
  router.get(
    "/:prediction_id",
    [validateRequest(RequestSchema), getDbClient],
    async (req, res) => {
      const { prediction_id } = req.params;

      predictions
        .getById(req.dbClient)(prediction_id)
        .then((prediction) => {
          if (!prediction) {
            return res
              .status(404)
              .json(
                responseUtils.writeError(
                  ErrorCode.BAD_REQUEST,
                  `Predicton with id ${prediction_id} does not exist.`
                )
              );
          }

          const response = responseUtils.writeSuccess(
            prediction,
            "Prediction fetched successfully."
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
                "Unable to fetch prediction."
              )
            );
        });
    }
  );
};
