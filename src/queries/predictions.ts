import pool from "../db";
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
        WHEN p.judged_date IS NOT NULL THEN
          CASE 
            WHEN 
                (SELECT COUNT(id) FROM votes where votes.prediction_id = p.id AND votes.vote IS TRUE) > 
                (SELECT COUNT(id) FROM votes where votes.prediction_id = p.id AND votes.vote IS FALSE)
              THEN 'successful'
            ELSE 'failed'
          END
        WHEN p.closed_date IS NOT NULL THEN 'closed'
        ELSE 'open'
      END) as status,
    (SELECT 
      COALESCE(
        jsonb_agg(p_bets), '[]') FROM
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
              endorsed,
              (SELECT 
                COALESCE(
                  NULLIF(
                    EXTRACT(
                      DAY FROM
                        CASE
                          WHEN p.closed_date IS NOT NULL THEN p.closed_date - b.date
                          ELSE p.due_date - b.date
                        END
                    ),
                    0
                  ),
                  1
                )
              ) as wager
            FROM bets b
            WHERE b.prediction_id = p.id
            ORDER BY date ASC
          ) p_bets 
        ) as bets,
    (SELECT 
      COALESCE(
        jsonb_agg(p_votes), '[]') FROM
          (SELECT 
              id, 
              (SELECT row_to_json(vott) FROM 
                (SELECT 
                    u.id, 
                    u.discord_id
                  FROM users u 
                  WHERE u.id = v.user_id) 
                vott) 
              as voter, 
              voted_date,
              vote
            FROM votes v
            WHERE v.prediction_id = p.id
            ORDER BY voted_date DESC
          ) p_votes
        ) as votes
  FROM predictions p
  WHERE p.id = $1
`;

const RETIRE_PREDICTION_BY_ID = `
  UPDATE predictions SET retired_date = NOW() WHERE predictions.id = $1;
`;

const CLOSE_PREDICTION_BY_ID = `
  UPDATE predictions SET triggerer_id = $2, closed_date = $3, triggered_date = NOW() WHERE predictions.id = $1;
`;
const JUDGE_PREDICTION_BY_ID = `
  UPDATE predictions SET judged_date = NOW() WHERE predictions.id = $1;
`;

const GET_NEXT_PREDICTION_TO_TRIGGER = `
  SELECT id, due_date FROM predictions WHERE due_date < NOW() AND triggered_date IS NULL ORDER BY due_date ASC LIMIT 1
`;

const GET_NEXT_PREDICTION_TO_JUDGE = `
  SELECT id FROM predictions WHERE judged_date IS NULL AND triggered_date + '1 day' < NOW() ORDER BY due_date ASC LIMIT 1
`;

export default {
  add: function (
    user_id: string,
    text: string,
    due_date: Date,
    created_date: Date = new Date()
  ): Promise<APIPredictions.AddPrediction> {
    return pool.connect().then((client) => {
      return client
        .query<APIPredictions.AddPrediction>(ADD_PREDICTION, [
          user_id,
          text,
          due_date,
          created_date,
        ])
        .then((response) => {
          client.release();
          return response.rows[0];
        });
    });
  },

  getByPredictionId: function (
    prediction_id: number | string
  ): Promise<APIPredictions.GetPredictionById | null> {
    return pool.connect().then((client) => {
      return client
        .query<Omit<APIPredictions.GetPredictionById, "payouts">>(
          GET_ENHANCED_PREDICTION_BY_ID,
          [prediction_id]
        )
        .then((response) => {
          client.release();
          if (response.rows.length === 0) {
            return null;
          }
          return addRatiosToPrediction(response.rows[0]);
        });
    });
  },

  retirePredictionById: function (
    prediction_id: number | string
  ): Promise<APIPredictions.RetirePredictionById> {
    return pool.connect().then((client) => {
      return client
        .query<null>(RETIRE_PREDICTION_BY_ID, [prediction_id])
        .then(() => {
          client.release();
          return this.getByPredictionId(prediction_id);
        });
    });
  },

  closePredictionById: function (
    prediction_id: number | string,
    triggerer_id: number | string | null,
    closed_date: Date
  ): Promise<APIPredictions.ClosePredictionById> {
    return pool.connect().then((client) => {
      return client
        .query<null>(CLOSE_PREDICTION_BY_ID, [
          prediction_id,
          triggerer_id,
          closed_date,
        ])
        .then(() => {
          client.release();
          return this.getByPredictionId(prediction_id);
        });
    });
  },

  judgePredictionById: function (
    prediction_id: number | string
  ): Promise<APIPredictions.JudgePredictionById> {
    return pool.connect().then((client) => {
      return client
        .query<null>(JUDGE_PREDICTION_BY_ID, [prediction_id])
        .then(() => {
          client.release();
          return this.getByPredictionId(prediction_id);
        });
    });
  },

  getNextPredictionToTrigger: function (): Promise<
    APIPredictions.GetNextPredictionToTrigger | undefined
  > {
    return pool.connect().then((client) => {
      return client
        .query<APIPredictions.GetNextPredictionToTrigger>(
          GET_NEXT_PREDICTION_TO_TRIGGER
        )
        .then((res) => {
          client.release();
          return res.rows[0];
        });
    });
  },

  getNextPredictionToJudge: function (): Promise<
    APIPredictions.GetNextPredictionToJudge | undefined
  > {
    return pool.connect().then((client) => {
      return client
        .query<APIPredictions.GetNextPredictionToJudge>(
          GET_NEXT_PREDICTION_TO_JUDGE
        )
        .then((res) => {
          client.release();
          return res.rows[0];
        });
    });
  },
};
