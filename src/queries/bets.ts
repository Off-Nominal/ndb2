import client from "../db";
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
    prediction_id: number,
    endorsed: boolean,
    date: Date = new Date()
  ) => {
    return client
      .query<APIBets.AddBet>(ADD_BET, [user_id, prediction_id, endorsed, date])
      .then((response) => response.rows[0]);
  },
};
