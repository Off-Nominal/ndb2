import express, { Request, Response } from "express";
import { getDbClient } from "../../middleware/getDbClient";
import paramValidator from "../../middleware/paramValidator";
import predictions from "../../queries/predictions";
import responseUtils from "../../utils/response";
const router = express.Router();

enum PredictionsFilter {
  RECENT = "recent",
  UPCOMING = "upcoming",
}

const isPredictionsFilter = (val: any): val is PredictionsFilter => {
  if (typeof val !== "string") {
    return false;
  }

  return Object.values(PredictionsFilter).includes(val as PredictionsFilter);
};

router.get(
  "/",
  [
    paramValidator.string("filter", { type: "query" }),
    paramValidator.integerParseableString("page", {
      type: "query",
      optional: true,
    }),
    getDbClient,
  ],
  async (req: Request, res: Response) => {
    const { filter, page } = req.query;

    if (!isPredictionsFilter(filter)) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            "MALFORMED_BODY_DATA",
            `Filter must be any of the following: ${Object.values(
              PredictionsFilter
            ).join(", ")}`
          )
        );
    }

    let promise: Promise<void>;

    if (filter === PredictionsFilter.RECENT) {
      promise = predictions
        .getRecentPredictions(req.dbClient)(page as string)
        .then((predictions) => {
          res.json(
            responseUtils.writeSuccess(
              predictions,
              "Predictions fetched successfully."
            )
          );
        });
    }

    if (filter === PredictionsFilter.UPCOMING) {
      promise = predictions
        .getUpcomingPredictions(req.dbClient)(page as string)
        .then((predictions) => {
          res.json(
            responseUtils.writeSuccess(
              predictions,
              "Predictions fetched successfully."
            )
          );
        });
    }

    promise.then(() => req.dbClient.release());
  }
);

export default router;
