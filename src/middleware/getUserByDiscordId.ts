import { NextFunction, Request, Response } from "express";
import users from "../queries/users";
import responseUtils from "../utils/response";

export const getUserByDiscordId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const discord_id = req.params.discord_id || req.body.discord_id;

  try {
    const fetchedUser = await users.getByDiscordId(req.dbClient)(discord_id);
    if (!fetchedUser) {
      const user = await users.add(req.dbClient)(discord_id);
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
          "SERVER_ERROR",
          "Error Fetching or Adding user"
        )
      );
  }

  next();
};
