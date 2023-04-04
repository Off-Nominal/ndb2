import express, { Request, Response } from "express";
import scores from "../../queries/scores";
import responseUtils from "../../utils/response";
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

router.get("/", async (req: Request, res: Response) => {
  const view = req.query.view || ScoreView.POINTS;

  if (!isScoreView(view)) {
    return res
      .status(400)
      .json(
        responseUtils.writeError(
          "MALFORMED_BODY_DATA",
          `View must be any of the following: ${Object.values(ScoreView).join(
            ", "
          )}`
        )
      );
  }

  scores.getLeaderboard(view).then((response) => {
    res.json(
      responseUtils.writeSuccess(response, "Leaderboard fetched successfully.")
    );
  });
});

export default router;
