import express, { Request, Response } from "express";
import { isNumberParseableString } from "../../helpers/typeguards";
import users from "../../queries/users";
import responseUtils from "../../utils/response";
const router = express.Router();

router.get("/:discord_id/scores", async (req: Request, res: Response) => {
  const { discord_id } = req.params;

  // Query parameter validation
  if (!isNumberParseableString(discord_id)) {
    return res
      .status(400)
      .json(
        responseUtils.writeError(
          "MALFORMED_BODY_DATA",
          "Discord Ids must be a parseable as a number."
        )
      );
  }

  users.getUserAllTimeScoreByDiscordId(discord_id).then((response) => {
    res.json(
      responseUtils.writeSuccess(response, "Score fetched successfully.")
    );
  });
});

export default router;
