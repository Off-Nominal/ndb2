import users from "../db/queries/users";
import responseUtils_deprecated from "../utils/response";
import { ErrorCode } from "../types/responses";
import { RequestHandler } from "express";

export const getUserByDiscordId: RequestHandler = async (req, res, next) => {
  if (!req.dbClient) {
    return res
      .status(500)
      .json(
        responseUtils_deprecated.writeError(
          ErrorCode.SERVER_ERROR,
          "Database client is missing.",
          null
        )
      );
  }

  if (!req.params) {
    return res
      .status(400)
      .json(
        responseUtils_deprecated.writeError(
          ErrorCode.MALFORMED_QUERY_PARAMS,
          "Query params are missing.",
          null
        )
      );
  }

  if (!req.body) {
    return res
      .status(400)
      .json(
        responseUtils_deprecated.writeError(
          ErrorCode.MALFORMED_BODY_DATA,
          "Body data is missing.",
          null
        )
      );
  }

  const discord_id =
    req.params["discord_id" as keyof typeof req.params] ||
    req.body["discord_id" as keyof typeof req.body];

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
        responseUtils_deprecated.writeError(
          ErrorCode.SERVER_ERROR,
          "Error Fetching or Adding user",
          null
        )
      );
  }

  next();
};
