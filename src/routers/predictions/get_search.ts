import express, { Request, Response } from "express";
import { getDbClient } from "../../middleware/getDbClient";
import paramValidator from "../../middleware/paramValidator";
import predictions, { SortByOption } from "../../queries/predictions";
import { PredictionLifeCycle } from "../../types/predicitions";
import responseUtils from "../../utils/response";
const router = express.Router();

const isPredictionLifeCycle = (val: any): val is PredictionLifeCycle => {
  if (typeof val !== "string") {
    return false;
  }

  return Object.values(PredictionLifeCycle).includes(
    val as PredictionLifeCycle
  );
};

const isSortByOption = (val: any): val is SortByOption => {
  if (typeof val !== "string") {
    return false;
  }

  return Object.values(SortByOption).includes(val as SortByOption);
};

router.get(
  "/search",
  [
    paramValidator.string("status", { type: "query", optional: true }),
    paramValidator.string("sort_by", { type: "query", optional: true }),
    paramValidator.integerParseableString("page", {
      type: "query",
      optional: true,
    }),
    getDbClient,
  ],
  async (req: Request, res: Response) => {
    const { status, sort_by, page } = req.query;

    console.log(sort_by);

    if (Object.values(req.query).length === 0) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            "MALFORMED_QUERY_PARAMS",
            `Please provide at least one query parameter in your search.`
          )
        );
    }

    if (status !== undefined && !isPredictionLifeCycle(status)) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            "MALFORMED_QUERY_PARAMS",
            `Status must be any of the following: ${Object.values(
              PredictionLifeCycle
            ).join(", ")}`
          )
        );
    }

    if (sort_by !== undefined && !isSortByOption(sort_by)) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            "MALFORMED_QUERY_PARAMS",
            `Sort option must be any of the following: ${Object.values(
              SortByOption
            ).join(", ")}`
          )
        );
    }

    predictions
      .searchPredictions(req.dbClient)({
        sort_by: sort_by as SortByOption,
        status: status as PredictionLifeCycle,
        page: page as string,
      })
      .then((predictions) => {
        res.json(
          responseUtils.writeSuccess(
            predictions,
            "Predictions fetched successfully."
          )
        );
      })
      .then(() => req.dbClient.release());
  }
);

export default router;
