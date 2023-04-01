import pool from "../db";
import { APIBets } from "../types/bets";

const ADD_BET = `
  INSERT INTO bets (
    user_id,
    prediction_id,
    endorsed,
    date
  ) VALUES (
    $1,
    $2,
    $3,
    $4
  ) RETURNING id, user_id, prediction_id, date, endorsed`;

export default {
  add: (
    user_id: string,
    prediction_id: number | string,
    endorsed: boolean,
    date: Date = new Date()
  ) => {
    return pool.connect().then((client) => {
      return client
        .query<APIBets.AddBet>(ADD_BET, [
          user_id,
          prediction_id,
          endorsed,
          date,
        ])
        .then((response) => {
          client.release();
          return response.rows[0];
        });
    });
  },
};
