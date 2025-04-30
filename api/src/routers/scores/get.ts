import express, { Request, Response } from "express";
import { getDbClient } from "../../middleware/getDbClient";
import scores from "../../db/queries/scores";
import responseUtils_deprecated from "../../utils/response";
import { ErrorCode } from "../../types/responses";
const router = express.Router();

export enum ScoreView {
  POINTS = "points",
  PREDICTIONS = "predictions",
  BETS = "bets",
}

export const isScoreView = (val: any): val is ScoreView => {
  if (typeof val !== "string") {
    return false;
  }

  return Object.values(ScoreView).includes(val as ScoreView);
};

router.get("/", getDbClient, async (req: Request, res: Response) => {
  const view = req.query.view || ScoreView.POINTS;

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
    .getLeaderboard(req.dbClient)(view)
    .then((response) => {
      res.json(
        responseUtils_deprecated.writeSuccess(
          response,
          "Leaderboard fetched successfully."
        )
      );
    });
});

export default router;
