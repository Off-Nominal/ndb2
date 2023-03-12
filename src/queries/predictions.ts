import client from "../db";
import { APIPredictions } from "../types/predicitions";

const ADD_PREDICTION = `
  INSERT INTO predictions (
    user_id,
    text,
    due_date,
    created_date
  ) VALUES (
    $1,
    $2,
    $3,
    $4
  ) RETURNING id, user_id, text, created_date, due_date, closed_date, judged_date, successful
`;

const GET_ENHANCED_PREDICTION_BY_ID = `
  SELECT
    p.id,
    (SELECT row_to_json(pred) FROM (SELECT p.user_id as id, u.discord_id) pred) as predictor,
    p.text,
    p.created_date,
    p.due_date,
    p.closed_date,
    p.judged_date,
    p.successful,
    (SELECT jsonb_agg(bets) FROM (SELECT id, date, endorsed FROM bets WHERE bets.prediction_id = p.id) bets) as bets
  FROM predictions p
  JOIN bets b ON b.prediction_id = p.id
  JOIN users u ON u.id = p.user_id
  WHERE p.id = $1
`;

export default {
  add: function (
    user_id: string,
    text: string,
    due_date: Date,
    created_date: Date = new Date()
  ) {
    return client
      .query<APIPredictions.AddPrediction>(ADD_PREDICTION, [
        user_id,
        text,
        due_date,
        created_date,
      ])
      .then((response) => response.rows[0]);
  },

  getByPredictionId: function (prediction_id: number) {
    return client
      .query<APIPredictions.GetPredictionById>(GET_ENHANCED_PREDICTION_BY_ID, [
        prediction_id,
      ])
      .then((response) => response.rows[0]);
  },
};
