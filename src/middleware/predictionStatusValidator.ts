import { NextFunction, Request, Response } from "express";
import { PredictionLifeCycle } from "../types/predicitions";
import responseUtils from "../utils/response";

const predictionStatusValidator = (
  statuses: PredictionLifeCycle[] | PredictionLifeCycle
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const status = req.prediction.status;

    const allowedStatuses = Array.isArray(statuses) ? statuses : [statuses];

    if (!allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            "BAD_REQUEST",
            `The requested change to this prediction is invalid because it's status is '${status}'. Allowable statuses are ${allowedStatuses
              .map((s) => `'${s}'`)
              .join(", ")}.`
          )
        );
    } else {
      next();
    }
  };
};

export default predictionStatusValidator;
