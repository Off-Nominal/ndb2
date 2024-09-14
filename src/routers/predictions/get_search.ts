import express, { Request, Response } from "express";
import { getDbClient } from "../../middleware/getDbClient";
import paramValidator from "../../middleware/paramValidator";
import predictions from "../../db/queries/predictions";
import { SortByOption } from "../../db/queries/predictions_search";
import { PredictionLifeCycle } from "../../types/predicitions";
import responseUtils from "../../utils/response";
import users from "../../db/queries/users";
import { ErrorCode } from "../../types/responses";
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
    paramValidator.string("creator", { type: "query", optional: true }),
    paramValidator.string("unbetter", { type: "query", optional: true }),
    paramValidator.string("season_id", { type: "query", optional: true }),
    paramValidator.boolean("include_non_season_applicable", {
      type: "query",
      optional: true,
    }),
    paramValidator.integerParseableString("page", {
      type: "query",
      optional: true,
    }),
    getDbClient,
  ],
  async (req: Request, res: Response) => {
    const {
      status,
      sort_by,
      page,
      keyword,
      creator,
      unbetter,
      season_id,
      include_non_season_applicable,
    } = req.query;

    if (
      !status &&
      !sort_by &&
      !keyword &&
      !creator &&
      !unbetter &&
      !season_id
    ) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            ErrorCode.MALFORMED_QUERY_PARAMS,
            `Please provide at least one standard query parameter in your search.`
          )
        );
    }

    if (creator && unbetter && creator === unbetter) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            ErrorCode.MALFORMED_QUERY_PARAMS,
            `Filtering by the same "creator" and "unbetter" is not allowed. These values must be different or omitted.`
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
              ErrorCode.MALFORMED_QUERY_PARAMS,
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
            ErrorCode.MALFORMED_QUERY_PARAMS,
            `Sort option must be any of the following: ${Object.values(
              SortByOption
            ).join(", ")}`
          )
        );
    }

    // check for user
    let creator_id: string;
    let unbetter_id: string;

    if (creator) {
      try {
        const user = await users.getByDiscordId(req.dbClient)(
          creator as string
        );
        if (!user) {
          throw null;
        }
        creator_id = user.id;
      } catch (err) {
        if (err === null) {
          return res
            .status(404)
            .json(
              responseUtils.writeError(
                ErrorCode.BAD_REQUEST,
                "User does not exist"
              )
            );
        }
        return res
          .status(500)
          .json(
            responseUtils.writeError(
              ErrorCode.BAD_REQUEST,
              "There was an error looking for the user in your query."
            )
          );
      }
    }

    if (unbetter) {
      try {
        const user = await users.getByDiscordId(req.dbClient)(
          unbetter as string
        );
        if (!user) {
          throw null;
        }
        unbetter_id = user.id;
      } catch (err) {
        if (err === null) {
          return res
            .status(404)
            .json(
              responseUtils.writeError(
                ErrorCode.BAD_REQUEST,
                "User does not exist"
              )
            );
        }
        return res
          .status(500)
          .json(
            responseUtils.writeError(
              ErrorCode.BAD_REQUEST,
              "There was an error looking for the user in your query."
            )
          );
      }
    }

    predictions
      .searchPredictions(req.dbClient)({
        keyword: keyword as string,
        sort_by: sort_by as SortByOption,
        statuses: statuses as PredictionLifeCycle[],
        page: Number(page),
        predictor_id: creator && creator_id,
        non_better_id: unbetter && unbetter_id,
        season_id: season_id as string,
        include_non_applicable: include_non_season_applicable === "true",
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
