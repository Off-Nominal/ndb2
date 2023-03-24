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
  ) RETURNING id, user_id, text, created_date, due_date, closed_date, judged_date
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
    p.triggered_date,
    (SELECT row_to_json(trig) FROM 
        (SELECT 
            p.triggerer_id as id, 
            u.discord_id 
          FROM users u 
          WHERE u.id = p.triggerer_id) 
      trig)
    as triggerer,
    p.judged_date,
    p.retired_date,
    (CASE
        WHEN p.retired_date IS NOT NULL THEN 'retired'
        WHEN p.judged_date IS NOT NULL THEN 'judged'
        WHEN p.closed_date IS NOT NULL THEN 'closed'
        ELSE 'open'
      END) as status,
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

const RETIRE_PREDICTION_BY_ID = `
  UPDATE predictions SET retired_date = NOW() WHERE predictions.id = $1;
`;

const CLOSE_PREDICTION_BY_ID = `
  UPDATE predictions SET triggerer_id = $2, closed_date = $3, triggered_date = NOW() WHERE predictions.id = $1;
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
  ): Promise<APIPredictions.GetPredictionById | null> {
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

  retirePredictionById: function (
    prediction_id: number | string
  ): Promise<APIPredictions.RetirePredictionById> {
    return client
      .query<null>(RETIRE_PREDICTION_BY_ID, [prediction_id])
      .then(() => this.getByPredictionId(prediction_id));
  },

  closePredictionById: function (
    prediction_id: number | string,
    triggerer_id: number | string,
    closed_date: Date
  ): Promise<APIPredictions.ClosePredictionById> {
    return client
      .query<null>(CLOSE_PREDICTION_BY_ID, [
        prediction_id,
        triggerer_id,
        closed_date,
      ])
      .then(() => this.getByPredictionId(prediction_id));
  },
};
