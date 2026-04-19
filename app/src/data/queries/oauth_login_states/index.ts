import { PoolClient } from "pg";
import {
  deleteOauthLoginStateReturning,
  insertOauthLoginState,
} from "./oauth_login_states.queries";

export default {
  insert:
    (dbClient: PoolClient) =>
    async (params: {
      state: string;
      return_to: string;
      expires_at: Date;
      code_verifier: string;
    }) => {
      await insertOauthLoginState.run(params, dbClient);
    },

  takeOauthLoginState: (dbClient: PoolClient) => async (state: string) => {
    const [row] = await deleteOauthLoginStateReturning.run({ state }, dbClient);
    if (!row) {
      return undefined;
    }
    return { return_to: row.return_to, code_verifier: row.code_verifier };
  },
};
