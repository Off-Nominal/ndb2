import { PoolClient } from "pg";
import { addVote } from "./votes.queries";

export default {
  add:
    (dbClient: PoolClient) =>
    async (params: {
      user_id: string;
      prediction_id: number;
      vote: boolean;
    }) => {
      const [result] = await addVote.run(params, dbClient);
      return result;
    },
};
