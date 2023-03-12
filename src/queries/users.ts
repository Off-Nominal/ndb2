import client from "../db";
import { APIUsers } from "../types/users";
import { v4 as uuidv4 } from "uuid";

const GET_USER_BY_DISCORD_ID = `
  SELECT id, discord_id 
  FROM users
  WHERE discord_id = $1`;

const ADD_USER = `
  INSERT INTO users (id, discord_id) 
  VALUES ($1, $2) 
  RETURNING id, discord_id`;

export default {
  getOrAddByDiscordId: async function (
    discordId: number
  ): Promise<APIUsers.User> {
    return this.getByDiscordId(discordId).then(
      (user) => user || this.add(discordId)
    );
  },

  getByDiscordId: function (discordId: number): Promise<APIUsers.User> {
    return client
      .query<APIUsers.GetUserByDiscordId>(GET_USER_BY_DISCORD_ID, [discordId])
      .then((response) => response.rows[0]);
  },

  add: function (discordId: number | number): Promise<APIUsers.User> {
    const id = uuidv4();
    return client
      .query<APIUsers.AddUser>(ADD_USER, [id, discordId])
      .then((response) => response.rows[0]);
  },
};
