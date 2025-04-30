import express, { Request, Response } from "express";
import { getDbClient } from "../../middleware/getDbClient";
import scores from "../../db/queries/scores";
import responseUtils_deprecated from "../../utils/response";
import { isScoreView, ScoreView } from "./get";
import paramValidator from "../../middleware/paramValidator";
import { ErrorCode } from "../../types/responses";
const router = express.Router();

router.get(
  "/seasons/:season_id",
  [
    paramValidator.isSeasonIdentifier("season_id", {
      type: "params",
    }),
    getDbClient,
  ],
  async (req: Request, res: Response) => {
    const view = req.query.view || ScoreView.POINTS;
    const { season_id } = req.params;

    let seasonIdentifier: "current" | "last" | number;

    if (season_id !== "current" && season_id !== "last") {
      seasonIdentifier = parseInt(season_id);
    } else {
      seasonIdentifier = season_id;
    }

    if (!isScoreView(view)) {
      return res
        .status(400)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.MALFORMED_BODY_DATA,
            `View must be any of the following: ${Object.values(ScoreView).join(
              ", "
            )}`
          )
        );
    }

    scores
      .getLeaderboard(req.dbClient)(view, seasonIdentifier)
      .then((response) => {
        res.json(
          responseUtils_deprecated.writeSuccess(
            response,
            "Leaderboard fetched successfully."
          )
        );
      });
  }
);

export default router;
