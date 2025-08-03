import type { PoolClient } from "pg";
import type { Request, Response, NextFunction } from "express";
import * as API from "@offnominal/ndb2-api-types/v2";
import responseUtils from "../v2/utils/response";
import predictions from "../v2/queries/predictions";

export const getPrediction = async (
  req: Request<
    { prediction_id: number },
    any,
    any,
    any,
    { dbClient: PoolClient; prediction: API.Entities.Predictions.Prediction }
  >,
  res: Response,
  next: NextFunction
) => {
  // Fetch prediction
  try {
    const response = await predictions.getById(res.locals.dbClient)(
      req.params.prediction_id
    );

    if (!response) {
      return res.status(404).json(
        responseUtils.writeErrors([
          {
            code: API.Errors.PREDICTION_NOT_FOUND,
            message: `Predicton with id ${res.locals.prediction_id} does not exist.`,
          },
        ])
      );
    }

    res.locals.prediction = response;
    return next();
  } catch (err) {
    console.error(err);
    return res.status(500).json(
      responseUtils.writeErrors([
        {
          code: API.Errors.SERVER_ERROR,
          message: "Unable to fetch prediction.",
        },
      ])
    );
  }
};
