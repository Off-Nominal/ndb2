import express, { Request, Response } from "express";
import { getUserByDiscordId } from "../../middleware/getUserByDiscordId";
import paramValidator from "../../middleware/paramValidator";
import users from "../../queries/users";
import responseUtils from "../../utils/response";
const router = express.Router();

router.get(
  "/:discord_id/scores",
  [
    paramValidator.numberParseableString("discord_id", { type: "params" }),
    getUserByDiscordId,
  ],
  async (req: Request, res: Response) => {
    users.getUserScoreById(req.user_id).then((response) => {
      res.json(
        responseUtils.writeSuccess(response, "Score fetched successfully.")
      );
    });
  }
);

export default router;
