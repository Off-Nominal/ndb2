import { NextFunction, Request, Response } from "express";
import { PoolClient } from "pg";
import * as API from "@offnominal/ndb2-api-types/v2";
import predictions from "../v2/queries/predictions";
import responseUtils from "../v2/utils/response";

const predictionStatusValidator = (
  statuses:
    | API.Entities.Predictions.PredictionLifeCycle[]
    | API.Entities.Predictions.PredictionLifeCycle
) => {
  return (
    req: Request<any, any, any, any, { dbClient: PoolClient }>,
    res: Response,
    next: NextFunction
  ) => {
    const allowedStatuses = Array.isArray(statuses) ? statuses : [statuses];

    predictions
      .isOfStatus(res.locals.dbClient)(
        req.params.prediction_id,
        allowedStatuses
      )
      .then((isAllowed) => {
        if (!isAllowed) {
          throw new Error();
        }

        next();
      })
      .catch((err) => {
        if (err instanceof Error) {
          return res.status(400).json(
            responseUtils.writeErrors([
              {
                code: API.Errors.INVALID_PREDICTION_STATUS,
                message: err.message,
              },
            ])
          );
        }
      });
  };
};

export default predictionStatusValidator;
