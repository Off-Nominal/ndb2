import { PoolClient } from "pg";
import {
  getWebSessionWithUser,
  insertWebSession,
  revokeWebSession,
  updateWebSessionLastDiscordAuthzAt,
} from "./web_sessions.queries";

export default {
  insert:
    (dbClient: PoolClient) =>
    async (params: {
      user_id: string;
      csrf_token: string;
      expires_at: Date;
      last_discord_authz_at: Date;
    }) => {
      const [row] = await insertWebSession.run(params, dbClient);
      return row;
    },

  getValidWithUser:
    (dbClient: PoolClient) => async (id: string) => {
      const [row] = await getWebSessionWithUser.run({ id }, dbClient);
      return row;
    },

  revoke: (dbClient: PoolClient) => async (id: string) => {
    await revokeWebSession.run({ id }, dbClient);
  },

  updateLastDiscordAuthzAt:
    (dbClient: PoolClient) =>
    async (params: { id: string; last_discord_authz_at: Date }) => {
      const [row] = await updateWebSessionLastDiscordAuthzAt.run(
        params,
        dbClient,
      );
      return row;
    },
};
