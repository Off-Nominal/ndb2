import express, { Request, Response } from "express";
import { getDbClient } from "../../middleware/getDbClient";
import { fetchUser } from "../../middleware/fetchUser";
import paramValidator from "../../middleware/paramValidator";
import users from "../../db/oldQueries/users";
import responseUtils from "../../utils/response";
const router = express.Router();

router.get(
  "/:discord_id/scores/seasons/:season_id",
  [
    paramValidator.numberParseableString("discord_id", { type: "params" }),
    paramValidator.isSeasonIdentifier("season_id", {
      type: "params",
    }),
    getDbClient,
    fetchUser,
  ],
  async (req: Request, res: Response) => {
    const { season_id } = req.params;

    let seasonIdentifier: "current" | "last" | number;

    if (season_id !== "current" && season_id !== "last") {
      seasonIdentifier = parseInt(season_id);
    } else {
      seasonIdentifier = season_id;
    }

    users
      .getUserScoreById(req.dbClient)(req.user_id, seasonIdentifier)
      .then((response) => {
        res.json(
          responseUtils.writeSuccess(response, "Score fetched successfully.")
        );
      });
  }
);

export default router;
