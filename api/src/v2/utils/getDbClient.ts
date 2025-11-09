import type { Response } from "express";
import pool from "../../db";

export const getDbClient = async (res: Response) =>
  pool.connect().then((client) => {
    res.on("finish", () => {
      client.release();
    });
    return client;
  });
