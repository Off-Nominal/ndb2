import client from "../db";
import { APIPredictions } from "../types/predicitions";
import { addRatiosToPrediction } from "../utils/mechanics";

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
    (SELECT row_to_json(pred) FROM 
        (SELECT 
            p.user_id as id, 
            u.discord_id 
          FROM users u 
          WHERE u.id = p.user_id) 
      pred)
    as predictor,
    p.text,
    p.created_date,
    p.due_date,
    p.closed_date,
    p.judged_date,
    p.successful,
    (SELECT jsonb_agg(p_bets) FROM
      (SELECT 
          id, 
          (SELECT row_to_json(bett) FROM 
            (SELECT 
                u.id, 
                u.discord_id
              FROM users u 
              WHERE u.id = b.user_id) 
            bett) 
          as better, 
          date,
          endorsed 
        FROM bets b
        WHERE b.prediction_id = p.id
      ) p_bets ) as bets
  FROM predictions p
  WHERE p.id = $1
`;

export default {
  add: function (
    user_id: string,
    text: string,
    due_date: Date,
    created_date: Date = new Date()
  ): Promise<APIPredictions.AddPrediction> {
    return client
      .query<APIPredictions.AddPrediction>(ADD_PREDICTION, [
        user_id,
        text,
        due_date,
        created_date,
      ])
      .then((response) => response.rows[0]);
  },

  getByPredictionId: function (
    prediction_id: number | string
  ): Promise<APIPredictions.GetPredictionById> {
    return client
      .query<Omit<APIPredictions.GetPredictionById, "payouts">>(
        GET_ENHANCED_PREDICTION_BY_ID,
        [prediction_id]
      )
      .then((response) => {
        if (response.rows.length === 0) {
          return null;
        }
        return addRatiosToPrediction(response.rows[0]);
      });
  },
};
