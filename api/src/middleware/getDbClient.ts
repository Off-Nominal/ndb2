import pool from "../db";
import type { Response } from "express";

export const getDbClient = async (res: Response) =>
  pool.connect().then((client) => {
    res.on("finish", () => {
      client.release();
    });
    return client;
  });
