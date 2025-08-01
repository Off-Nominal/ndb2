import predictions from "../db/queries/predictions";
import { APIPredictions } from "../types/predicitions";
import responseUtils_deprecated from "../utils/response";
import { ErrorCode } from "../types/responses";
import { RequestHandler, Response } from "express";
import { PoolClient } from "pg";

interface WithPrediction {
  dbClient: PoolClient;
  prediction: APIPredictions.EnhancedPrediction;
}

export const getPrediction: RequestHandler<
  any,
  any,
  any,
  any,
  WithPrediction
> = async (req, res: Response<any, Record<string, any>>, next) => {
  if (!req.params) {
    return res
      .status(400)
      .json(
        responseUtils_deprecated.writeError(
          ErrorCode.MALFORMED_QUERY_PARAMS,
          "Query params are missing.",
          null
        )
      );
  }

  const prediction_id = req.params["prediction_id" as keyof typeof req.params];
  // Fetch prediction
  try {
    const response = await predictions.getPredictionById(res.locals.dbClient)(
      prediction_id
    );

    if (!response) {
      return res
        .status(404)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.BAD_REQUEST,
            `Predicton with id ${prediction_id} does not exist.`,
            null
          )
        );
    }

    res.locals.prediction = response;
    return next();
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json(
        responseUtils_deprecated.writeError(
          ErrorCode.SERVER_ERROR,
          "Unable to fetch prediction.",
          null
        )
      );
  }
};
