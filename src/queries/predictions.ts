import client from "../db";
import { APIPredictions } from "../types/predicitions";
// import { APIUsers } from "../types/users";

// type GetUsersOptions = {
//   uuid?: string | number;
//   discordId?: string | number;
//   // enhanced?: T;
// };

const ADD_PREDICTION = `
  INSERT INTO predictions (
    user_id,
    text,
    created_date,
    due_date
  ) VALUES (
    $1,
    $2,
    NOW(),
    $3
  ) RETURNING id, user_id, text, created_date, due_date, closed_date, judged_date, successful
`;

export default {
  // get: (options: GetUsersOptions = {}): Promise<APIUsers.GetUsers> => {
  //   const { uuid, discordId } = options;
  //   let query = `SELECT uuid, discord_id FROM users`;
  //   const parameters = [];
  //   if (uuid || discordId) {
  //     query += ` WHERE `;
  //   }
  //   if (uuid) {
  //     query += `uuid = $1`;
  //     parameters.push(uuid);
  //   }
  //   if (discordId) {
  //     if (uuid) {
  //       query += `AND discordId = $2`;
  //     } else {
  //       query += `discordId = $1`;
  //     }
  //     parameters.push(discordId);
  //   }
  //   return client.query(query, parameters).then((res) => res.rows);
  // },
  add: (user_id: string, text: string, due_date: Date) => {
    return client
      .query<APIPredictions.AddPrediction>(ADD_PREDICTION, [
        user_id,
        text,
        due_date,
      ])
      .then((response) => response.rows[0]);
  },
};
