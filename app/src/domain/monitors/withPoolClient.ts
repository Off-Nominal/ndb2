import { PoolClient } from "pg";
import pool from "../../data/db";

export const withPoolClient = (callback: (client: PoolClient) => Promise<void>) =>
  pool.connect().then((client) => callback(client).finally(() => client.release()));

