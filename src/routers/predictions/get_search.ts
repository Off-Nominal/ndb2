import express, { Request, Response } from "express";
import { getDbClient } from "../../middleware/getDbClient";
import paramValidator from "../../middleware/paramValidator";
import predictions from "../../queries/predictions";
import { SortByOption } from "../../queries/predictions_search";
import { PredictionLifeCycle } from "../../types/predicitions";
import responseUtils from "../../utils/response";
import { getUserByDiscordId } from "../../middleware/getUserByDiscordId";
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
    paramValidator.boolean("mine", { type: "query", optional: true }),
    paramValidator.boolean("opportunities", { type: "query", optional: true }),
    paramValidator.integerParseableString("page", {
      type: "query",
      optional: true,
    }),
    getDbClient,
    getUserByDiscordId,
  ],
  async (req: Request, res: Response) => {
    const { status, sort_by, page, keyword, mine, opportunities } = req.query;

    if (!status && !sort_by && !keyword && !mine && !opportunities) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            "MALFORMED_QUERY_PARAMS",
            `Please provide at least one query parameter in your search.`
          )
        );
    }

    if (mine && opportunities) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            "MALFORMED_QUERY_PARAMS",
            `Filtering by both "mine" and "opportunities" is not allowed. You can only filter by one or the other.`
          )
        );
    }

    let statuses = [];

    if (Array.isArray(status)) {
      statuses = status;
    } else if (typeof status === "string") {
      statuses.push(status);
    }

    for (const status of statuses) {
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
        keyword: keyword as string,
        sort_by: sort_by as SortByOption,
        statuses: statuses as PredictionLifeCycle[],
        page: Number(page),
        predictor_id: mine ? req.user_id : undefined,
        non_better_id: opportunities ? req.user_id : undefined,
      })
      .then((predictions) => {
        res.json(
          responseUtils.writeSuccess(
            predictions,
            "Predictions fetched successfully."
          )
        );
      });
  }
);

export default router;
