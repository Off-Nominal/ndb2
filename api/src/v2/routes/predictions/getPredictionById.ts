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
    const err = errors[0];

    if (err.type === "params") {
      res
        .status(400)
        .json(
          responseUtils.writeError(
            API.Errors.MALFORMED_QUERY_PARAMS,
            err.errors.issues.map((issue) => issue.message).join(", ")
          )
        );
    } else {
      res
        .status(500)
        .json(
          responseUtils.writeError(
            API.Errors.SERVER_ERROR,
            "There was an error processing your request."
          )
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
          return res
            .status(404)
            .json(
              responseUtils.writeError(
                API.Errors.NOT_FOUND,
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
              API.Errors.SERVER_ERROR,
              "Unable to fetch prediction."
            )
          );
      });
  });
};
