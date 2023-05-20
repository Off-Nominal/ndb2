import express, { Request, Response } from "express";
import { getDbClient } from "../../middleware/getDbClient";
import paramValidator from "../../middleware/paramValidator";
import predictions from "../../queries/predictions";
import { SortByOption } from "../../queries/predictions_search";
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
    paramValidator.string("status", {
      type: "query",
      optional: true,
      allowArray: true,
    }),
    paramValidator.string("sort_by", { type: "query", optional: true }),
    paramValidator.string("keyword", { type: "query", optional: true }),
    paramValidator.integerParseableString("page", {
      type: "query",
      optional: true,
    }),
    getDbClient,
  ],
  async (req: Request, res: Response) => {
    const { status, sort_by, page, keyword } = req.query;

    if (!status && !sort_by && !keyword) {
      res
        .status(400)
        .json(
          responseUtils.writeError(
            "MALFORMED_QUERY_PARAMS",
            `Please provide at least one query parameter in your search.`
          )
        );
      return req.dbClient.release();
    }

    let statuses = [];

    if (Array.isArray(status)) {
      statuses = status;
    } else if (typeof status === "string") {
      statuses.push(status);
    }

    for (const status of statuses) {
      if (status !== undefined && !isPredictionLifeCycle(status)) {
        res
          .status(400)
          .json(
            responseUtils.writeError(
              "MALFORMED_QUERY_PARAMS",
              `Status must be any of the following: ${Object.values(
                PredictionLifeCycle
              ).join(", ")}`
            )
          );

        return req.dbClient.release();
      }
    }

    if (sort_by !== undefined && !isSortByOption(sort_by)) {
      res
        .status(400)
        .json(
          responseUtils.writeError(
            "MALFORMED_QUERY_PARAMS",
            `Sort option must be any of the following: ${Object.values(
              SortByOption
            ).join(", ")}`
          )
        );

      return req.dbClient.release();
    }

    predictions
      .searchPredictions(req.dbClient)({
        keyword: keyword as string,
        sort_by: sort_by as SortByOption,
        statuses: statuses as PredictionLifeCycle[],
        page: Number(page),
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
