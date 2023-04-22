import { PoolClient } from "pg";
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
  ) 
  ON CONFLICT (user_id, prediction_id) 
  DO UPDATE SET endorsed = $3
  RETURNING id, user_id, prediction_id, date, endorsed`;

const add = (client: PoolClient) => {
  return (
    user_id: string,
    prediction_id: number | string,
    endorsed: boolean,
    date: Date = new Date()
  ) => {
    return client
      .query<APIBets.AddBet>(ADD_BET, [user_id, prediction_id, endorsed, date])
      .then((response) => response.rows[0]);
  };
};

export default {
  add,
};
