import pool from "../../db";
import responseUtils_deprecated from "../../utils/response";
import { ErrorCode } from "../../types/responses";
import { RequestHandler } from "express";

export const getDbClient: RequestHandler = (req, res, next) => {
  pool
    .connect()
    .then((client) => {
      req.dbClient = client;

      // release client when finished
      res.on("finish", () => {
        client.release();
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
