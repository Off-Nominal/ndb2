import express, { Request, Response } from "express";
import paramValidator from "../../middleware/paramValidator";
import scores from "../../queries/scores";
import responseUtils from "../../utils/response";
import { isScoreView, ScoreView } from "./get";
const router = express.Router();

router.get(
  "/seasons/:season_id",
  [
    paramValidator.integerParseableString("season_id", { type: "params" }),
    paramValidator.isPostgresInt("season_id", { type: "params" }),
  ],
  async (req: Request, res: Response) => {
    const view = req.query.view || ScoreView.POINTS;
    const { season_id } = req.params;

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

    scores.getLeaderboard(view, season_id).then((response) => {
      res.json(
        responseUtils.writeSuccess(
          response,
          "Leaderboard fetched successfully."
        )
      );
    });
  }
);

export default router;
