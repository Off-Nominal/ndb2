import express, { Request, Response } from "express";
import { getDbClient } from "../../middleware/getDbClient";
import { fetchUser } from "../../middleware/fetchUser";
import paramValidator from "../../middleware/paramValidator";
import users from "../../db/oldQueries/users";
import responseUtils from "../../utils/response";
const router = express.Router();

router.get(
  "/:discord_id/scores",
  [
    paramValidator.numberParseableString("discord_id", { type: "params" }),
    getDbClient,
    fetchUser,
  ],
  async (req: Request, res: Response) => {
    users
      .getUserScoreById(req.dbClient)(req.user_id)
      .then((response) => {
        res.json(
          responseUtils.writeSuccess(response, "Score fetched successfully.")
        );
      });
  }
);

export default router;
