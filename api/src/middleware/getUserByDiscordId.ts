import users from "../db/queries/users";
import responseUtils_deprecated from "../utils/response";
import { ErrorCode } from "../types/responses";
import { RequestHandler, Response } from "express";
import { PoolClient } from "pg";

interface WithUserId {
  user_id: string;
  dbClient: PoolClient;
}

export const getUserByDiscordId: RequestHandler<
  any,
  any,
  any,
  any,
  WithUserId
> = async (req, res: Response<any, Record<string, any>>, next) => {
  if (!res.locals.dbClient) {
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
    const fetchedUser = await users.getByDiscordId(res.locals.dbClient)(
      discord_id
    );
    if (!fetchedUser) {
      const user = await users.add(res.locals.dbClient)(discord_id);
      res.locals.user_id = user.id;
    } else {
      res.locals.user_id = fetchedUser.id;
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
