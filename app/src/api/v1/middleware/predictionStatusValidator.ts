import { PredictionLifeCycle } from "../types/predicitions";
import responseUtils_deprecated from "../utils/response";
import { ErrorCode } from "../types/responses";
import { RequestHandler } from "express";

const predictionStatusValidator = (
  statuses: PredictionLifeCycle[] | PredictionLifeCycle
): RequestHandler => {
  return (req, res, next) => {
    if (!req.prediction) {
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
    const status = req.prediction.status;

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
