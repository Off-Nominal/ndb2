import express, { Request, Response } from "express";
import { getDbClient } from "../../middleware/getDbClient";
import { fetchUser } from "../../middleware/fetchUser";
import paramValidator from "../../middleware/paramValidator";
import users from "../../db/oldQueries/users";
import responseUtils from "../../utils/response";
import { getBetsByUserId } from "../../db/queries/bets/bets.queries";
const router = express.Router();

router.get(
  "/:discord_id/bets",
  [
    paramValidator.numberParseableString("discord_id", { type: "params" }),
    getDbClient,
    fetchUser,
  ],
  (req: Request, res: Response) => {
    getBetsByUserId
      .run({ user_id: req.user_id }, req.dbClient)
      .then((response) => {
        res.json(
          responseUtils.writeSuccess(response, "Bets fetched successfully.")
        );
      });
  }
);

export default router;
