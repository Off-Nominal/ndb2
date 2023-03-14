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

const GET_BET_BY_USER_ID_AND_PREDICTION_ID = `
    SELECT 
      id, 
      endorsed, 
      date, 
      prediction_id, 
      user_id
    FROM bets
    WHERE user_id = $1 AND prediction_id = $2
`;

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
  getBetByUserIdAndPredictionId: (user_id: string, prediction_id: number) => {
    return client
      .query<APIBets.GetBetByUserIdAndPredictionId>(
        GET_BET_BY_USER_ID_AND_PREDICTION_ID,
        [user_id, prediction_id]
      )
      .then((response) => response.rows[0]);
  },
};
