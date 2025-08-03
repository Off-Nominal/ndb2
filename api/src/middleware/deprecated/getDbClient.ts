import pool from "../../db";
import responseUtils_deprecated from "../../utils/response";
import { ErrorCode } from "../../types/responses";
import { WeakRequestHandler } from "express-zod-safe";

export const getDbClient: WeakRequestHandler = (req, res, next) => {
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
