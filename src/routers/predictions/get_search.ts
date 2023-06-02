import express, { Request, Response } from "express";
import { getDbClient } from "../../middleware/getDbClient";
import paramValidator from "../../middleware/paramValidator";
import predictions from "../../queries/predictions";
import { SortByOption } from "../../queries/predictions_search";
import { PredictionLifeCycle } from "../../types/predicitions";
import responseUtils from "../../utils/response";
import users from "../../queries/users";
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
    paramValidator.integerParseableString("page", {
      type: "query",
      optional: true,
    }),
    getDbClient,
  ],
  async (req: Request, res: Response) => {
    const { status, sort_by, page, keyword, creator, unbetter, season_id } =
      req.query;

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
            `Please provide at least one query parameter in your search.`
          )
        );
    }

    if (creator && unbetter) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            ErrorCode.MALFORMED_QUERY_PARAMS,
            `Filtering by both "creator" and "unbetter" is not allowed. You can only filter by one or the other.`
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
    const userParam = creator || unbetter;
    let user_id: string;

    if (userParam) {
      try {
        const user = await users.getByDiscordId(req.dbClient)(
          userParam as string
        );
        if (!user) {
          throw new Error("User does not exist");
        }
        user_id = user.id;
      } catch (err) {
        return res
          .status(500)
          .json(
            responseUtils.writeError(
              ErrorCode.BAD_REQUEST,
              "User does not exist"
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
        predictor_id: creator && user_id,
        non_better_id: unbetter && user_id,
        season_id: season_id as string,
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
