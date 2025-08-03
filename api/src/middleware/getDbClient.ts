import pool from "../db";
import type { NextFunction, Request, Response } from "express";
import type { PoolClient } from "pg";
import responseUtils from "../v2/utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";

export const getDbClient = (
  req: Request<any, any, any, any, { dbClient: PoolClient }>,
  res: Response,
  next: NextFunction
) => {
  pool
    .connect()
    .then((client) => {
      res.locals.dbClient = client;

      // release client when finished
      res.on("finish", () => {
        client.release();
      });

      next();
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json(
        responseUtils.writeErrors([
          {
            code: API.Errors.SERVER_ERROR,
            message: `Unable to make database connection, request aborted.`,
          },
        ])
      );
    });
};
