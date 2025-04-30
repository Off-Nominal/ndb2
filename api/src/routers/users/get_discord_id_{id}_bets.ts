import express, { Request, Response } from "express";
import { getDbClient } from "../../middleware/getDbClient";
import { getUserByDiscordId } from "../../middleware/getUserByDiscordId";
import paramValidator from "../../middleware/paramValidator";
import users from "../../db/queries/users";
import responseUtils_deprecated from "../../utils/response";
const router = express.Router();

router.get(
  "/:discord_id/bets",
  [
    paramValidator.numberParseableString("discord_id", { type: "params" }),
    getDbClient,
    getUserByDiscordId,
  ],
  async (req: Request, res: Response) => {
    users
      .getBetsByUserId(req.dbClient)(req.user_id)
      .then((response) => {
        res.json(
          responseUtils_deprecated.writeSuccess(
            response,
            "Bets fetched successfully."
          )
        );
      });
  }
);

export default router;
