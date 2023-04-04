import express, { Request, Response } from "express";
import { getUserByDiscordId } from "../../middleware/getUserByDiscordId";
import users from "../../queries/users";
import responseUtils from "../../utils/response";
const router = express.Router();

router.get(
  "/:discord_id/scores",
  getUserByDiscordId,
  async (req: Request, res: Response) => {
    users.getUserScoreById(req.user_id).then((response) => {
      res.json(
        responseUtils.writeSuccess(response, "Score fetched successfully.")
      );
    });
  }
);

router.get(
  "/:discord_id/scores/seasons/:season_id",
  getUserByDiscordId,
  async (req: Request, res: Response) => {
    const { season_id } = req.params;

    users.getUserScoreById(req.user_id, season_id).then((response) => {
      res.json(
        responseUtils.writeSuccess(response, "Score fetched successfully.")
      );
    });
  }
);

export default router;
