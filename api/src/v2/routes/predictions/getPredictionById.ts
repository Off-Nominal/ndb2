import { Router } from "express";
import { z } from "zod";
import { predictionIdSchema } from "../../validations";
import { NDB2Route } from "../../utils/routerMap";
import predictions from "../../queries/predictions";
import { getDbClient } from "../../../middleware/getDbClient";
import responseUtils from "../../../utils/response";
import { ErrorCode } from "../../../types/responses";
import validate from "express-zod-safe";

const RequestSchema: Parameters<typeof validate>[0] = {
  handler: (errors, req, res, next) => {
    const err = errors[0];

    if (err.type === "params") {
      res
        .status(400)
        .json(
          responseUtils.writeError(
            ErrorCode.MALFORMED_QUERY_PARAMS,
            err.errors.issues.map((issue) => issue.message).join(", ")
          )
        );
    } else {
      res
        .status(500)
        .json(
          responseUtils.writeError(
            ErrorCode.SERVER_ERROR,
            "There was an error processing your request."
          )
        );
    }
  },
  params: z.object({
    prediction_id: predictionIdSchema,
  }),
};

export const getPredictionByIdHandler: NDB2Route = (router: Router) => {
  router.get(
    "/:prediction_id",
    [validate(RequestSchema), getDbClient],
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
                  ErrorCode.NOT_FOUND,
                  `Predicton with id ${prediction_id} does not exist.`
                )
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
