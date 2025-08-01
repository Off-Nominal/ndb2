import { RequestHandler } from "express";
import { APIPredictions, PredictionLifeCycle } from "../types/predicitions";
import responseUtils_deprecated from "../utils/response";
import { ErrorCode } from "../types/responses";

interface WithPrediction extends Record<string, any> {
  prediction: APIPredictions.EnhancedPrediction;
}

const predictionStatusValidator = (
  statuses: PredictionLifeCycle[] | PredictionLifeCycle
): RequestHandler<any, any, any, any, WithPrediction> => {
  return (req, res, next) => {
    if (!res.locals.prediction) {
      return res
        .status(400)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.MALFORMED_QUERY_PARAMS,
            "Prediction is missing.",
            null
          )
        );
    }
    const status = res.locals.prediction.status;

    const allowedStatuses = Array.isArray(statuses) ? statuses : [statuses];

    if (!allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.INVALID_PREDICTION_STATUS,
            `The requested change to this prediction is invalid because its status is '${status}'. Allowable statuses are ${allowedStatuses
              .map((s) => `'${s}'`)
              .join(", ")}.`,
            null
          )
        );
    } else {
      next();
    }
  };
};

export default predictionStatusValidator;
