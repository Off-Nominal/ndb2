import { PoolClient } from "pg";
import { addBet } from "./bets.queries";

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
};
