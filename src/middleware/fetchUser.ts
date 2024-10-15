import { NextFunction, Request, Response } from "express";
import responseUtils from "../utils/response";
import { ErrorCode } from "../types/responses";
import { getUserByDiscordId } from "../db/queries/users/users.queries";
import { users } from "../db/queries/users";

export const fetchUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const discord_id = req.params.discord_id || req.body.discord_id;

  try {
    const [fetchedUser] = await users.getByDiscordId(
      { discord_id },
      req.dbClient
    );

    if (!fetchedUser) {
      const [user] = await users.add({ discord_id }, req.dbClient);
      req.user_id = user.id;
    } else {
      req.user_id = fetchedUser.id;
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json(
        responseUtils.writeError(
          ErrorCode.SERVER_ERROR,
          "Error Fetching or Adding user"
        )
      );
  }

  next();
};
