import pool from "../db";
import responseUtils_deprecated from "../utils/response";
import { ErrorCode } from "../types/responses";
import { RequestHandler, Response } from "express";
import { PoolClient } from "pg";

interface WithDbClient {
  dbClient: PoolClient;
}

export const getDbClient: RequestHandler<any, any, any, any, WithDbClient> = (
  req,
  res: Response<any, Record<string, any>>,
  next
) => {
  pool
    .connect()
    .then((client) => {
      if (!client) {
        throw new Error();
      }

      res.locals.dbClient = client;

      // release client when finished
      res.on("finish", () => {
        res.locals.dbClient && res.locals.dbClient.release();
      });

      next();
    })
    .catch((err) => {
      return res
        .status(500)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.SERVER_ERROR,
            `Unable to make database connection, request aborted.`,
            null
          )
        );
    });
};
