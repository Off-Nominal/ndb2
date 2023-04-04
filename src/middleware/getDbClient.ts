import { NextFunction, Request, Response } from "express";
import pool from "../db";
import responseUtils from "../utils/response";

export const getDbClient = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  pool
    .connect()
    .then((client) => {
      if (!client) {
        throw new Error();
      }

      req.dbClient = client;
      next();
    })
    .catch((err) => {
      return res
        .status(500)
        .json(
          responseUtils.writeError(
            "SERVER_ERROR",
            `Unable to make database connection, request aborted.`
          )
        );
    });
};
