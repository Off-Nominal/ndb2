import client from "../db";
import { APIUsers } from "../types/users";

type GetUsersOptions = {
  uuid?: string | number;
  discordId?: string | number;
  // enhanced?: T;
};

export default {
  get: (options: GetUsersOptions = {}): Promise<APIUsers.User[]> => {
    const { uuid, discordId } = options;

    let query = `SELECT uuid, discord_id FROM users`;
    const parameters = [];

    if (uuid || discordId) {
      query += ` WHERE `;
    }

    if (uuid) {
      query += `uuid = $1`;
      parameters.push(uuid);
    }

    if (discordId) {
      if (uuid) {
        query += `AND discordId = $2`;
      } else {
        query += `discordId = $1`;
      }
      parameters.push(discordId);
    }

    return client.query(query, parameters).then((res) => res.rows);
  },

  add: (discordId: string | number): Promise<APIUsers.User[]> => {
    return client
      .query(
        `INSERT INTO users (discord_id) VALUES ($1) RETURNING uuid, discord_id`,
        [discordId]
      )
      .then((response) => response.rows);
  },
};
