import { PoolClient } from "pg";
import { deleteOauthLoginStateReturning, insertOauthLoginState } from "./oauth_login_states.queries";

export default {
  insert:
    (dbClient: PoolClient) =>
    async (params: { state: string; return_to: string; expires_at: Date }) => {
      await insertOauthLoginState.run(params, dbClient);
    },

  takeReturnToForState:
    (dbClient: PoolClient) => async (state: string) => {
      const [row] = await deleteOauthLoginStateReturning.run({ state }, dbClient);
      return row?.return_to;
    },
};
