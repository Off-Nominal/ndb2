import { NextFunction, Request, Response } from "express";
import { isNoMoreThan, isNumberParseableString } from "../helpers/typeguards";
import predictions from "../queries/predictions";
import { APIPredictions } from "../types/predicitions";
import responseUtils from "../utils/response";

export const getPrediction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { prediction_id } = req.params;

  // Body parameter validation
  if (!isNumberParseableString(prediction_id)) {
    return res
      .status(400)
      .json(
        responseUtils.writeError(
          "MALFORMED_BODY_DATA",
          "Predictions Ids must be a parseable as a safe integer."
        )
      );
  }

  // Postgres INTEGER type maxes at 2147483647, which is used as primary keys for predictions
  if (!isNoMoreThan(Number(prediction_id), 2147483647)) {
    return res
      .status(400)
      .json(
        responseUtils.writeError(
          "MALFORMED_BODY_DATA",
          "Predictions Ids can be no higher than at 2147483647."
        )
      );
  }

  // Fetch prediction
  let prediction: APIPredictions.EnhancedPrediction;

  try {
    prediction = await predictions.getByPredictionId(prediction_id);
    if (!prediction) {
      return res
        .status(404)
        .json(
          responseUtils.writeError(
            "BAD_REQUEST",
            `Predicton with id ${prediction_id} does not exist.`
          )
        );
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json(
        responseUtils.writeError("SERVER_ERROR", "Unable to fetch prediction.")
      );
  }

  req.prediction = prediction;
  next();
};
