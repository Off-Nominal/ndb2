import { PoolClient } from "pg";
import { addBet, getBetsByUserId as getBetsByUserIdQuery } from "./bets.queries";

export default {
  add:
    (dbClient: PoolClient) =>
    async (params: {
      user_id: string;
      prediction_id: number;
      endorsed: boolean;
      date: Date;
    }) => {
      const [result] = await addBet.run(params, dbClient);
      return result;
    },

  /** Rows for building a `Map<prediction_id, …>` scoped to the given search result IDs (typically current page). */
  getBetsByUserId:
    (dbClient: PoolClient) =>
    async (params: { user_id: string; prediction_ids: number[] }) => {
      return getBetsByUserIdQuery.run(params, dbClient);
    },
};
