import express, { Request, Response } from "express";
import { getDbClient } from "../../middleware/deprecated/getDbClient";
import { getUserByDiscordId } from "../../middleware/deprecated/getUserByDiscordId";
import paramValidator from "../../middleware/deprecated/paramValidator";
import users from "../../db/queries/users";
import responseUtils_deprecated from "../../utils/response";
import { ErrorCode } from "../../types/responses";
const router = express.Router();

router.get(
  "/:discord_id/scores/seasons/:season_id",
  [
    paramValidator.numberParseableString("discord_id", { type: "params" }),
    paramValidator.isSeasonIdentifier("season_id", {
      type: "params",
    }),
    getDbClient,
    getUserByDiscordId,
  ],
  async (req: Request, res: Response) => {
    if (!req.dbClient || !req.user_id) {
      return res
        .status(500)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.SERVER_ERROR,
            "Something went wrong. Please try again.",
            null
          )
        );
    }
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
          responseUtils_deprecated.writeSuccess(
            response,
            "Score fetched successfully."
          )
        );
      });
  }
);

export default router;
