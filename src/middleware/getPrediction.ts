import { NextFunction, Request, Response } from "express";
import pool from "../db";
import { isNoMoreThan, isNumberParseableString } from "../helpers/typeguards";
import predictions from "../queries/predictions";
import { APIPredictions } from "../types/predicitions";
import responseUtils from "../utils/response";
import { ErrorCode } from "../types/responses";

export const getPrediction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { prediction_id } = req.params;

  // Fetch prediction
  let prediction: APIPredictions.EnhancedPrediction;

  try {
    prediction = await predictions.getByPredictionId(req.dbClient)(
      prediction_id
    );

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
    req.prediction = prediction;
    return next();
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json(
        responseUtils.writeError(
          ErrorCode.SERVER_ERROR,
          "Unable to fetch prediction."
        )
      );
  }
};
