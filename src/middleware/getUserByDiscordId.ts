import { NextFunction, Request, Response } from "express";
import { isNumberParseableString } from "../helpers/typeguards";
import users from "../queries/users";
import responseUtils from "../utils/response";

export const getUserByDiscordId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const discord_id = req.params.discord_id || req.body.discord_id;

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

  // Fetch User
  let userId: string;

  try {
    const user = await users.getOrAddByDiscordId(discord_id);
    userId = user.id;
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json(
        responseUtils.writeError(
          "SERVER_ERROR",
          "Error Fetching or Adding user"
        )
      );
  }

  req.user_id = userId;
  next();
};
