import { PoolClient } from "pg";
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
  ) RETURNING id, user_id, text, created_date, due_date, closed_date, judged_date
`;

const GET_ENHANCED_PREDICTION_BY_ID = `
  SELECT
    ep.prediction_id as id,
    (SELECT row_to_json(pred) FROM 
        (SELECT 
            ep.predictor_id as id, 
            u.discord_id 
          FROM users u 
          WHERE u.id = ep.predictor_id) 
      pred)
    as predictor,
    ep.text,
    ep.created_date,
    ep.due_date,
    ep.closed_date,
    ep.triggered_date,
    (SELECT row_to_json(trig) FROM 
        (SELECT 
            ep.triggerer_id as id, 
            u.discord_id 
          FROM users u 
          WHERE u.id = ep.triggerer_id) 
      trig)
    as triggerer,
    ep.judged_date,
    ep.retired_date,
    ep.status,
    (SELECT 
      COALESCE(jsonb_agg(p_bets), '[]') 
      FROM
        (SELECT 
          eb.bet_id as id, 
          (SELECT row_to_json(bett) FROM 
            (SELECT 
                u.id, 
                u.discord_id
              FROM users u 
              WHERE u.id = eb.better_id) 
            bett) 
          as better, 
          eb.bet_date as date,
          eb.endorsed,
          eb.wager
          FROM enhanced_bets eb
          WHERE eb.prediction_id = ep.prediction_id
          ORDER BY date ASC
        ) p_bets 
  ) as bets,
  (SELECT 
    COALESCE(jsonb_agg(p_votes), '[]') 
    FROM
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
        WHERE v.prediction_id = ep.prediction_id
        ORDER BY voted_date DESC
      ) p_votes
  ) as votes,
  (SELECT row_to_json(payout_sum)
    FROM(
      SELECT ep.endorsement_ratio as endorse, ep.undorsement_ratio as undorse
    ) payout_sum
  ) as payouts
  FROM enhanced_predictions ep
  WHERE ep.prediction_id = $1
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

const add = (client: PoolClient) =>
  function (
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
      .then((response) => {
        return response.rows[0];
      });
  };

const getByPredictionId = (client: PoolClient) =>
  function (
    prediction_id: number | string
  ): Promise<APIPredictions.GetPredictionById | null> {
    return client
      .query<APIPredictions.GetPredictionById>(GET_ENHANCED_PREDICTION_BY_ID, [
        prediction_id,
      ])
      .then((response) => response.rows[0] ?? null);
  };

const retirePredictionById = (client: PoolClient) =>
  function (
    prediction_id: number | string
  ): Promise<APIPredictions.RetirePredictionById> {
    return client
      .query<null>(RETIRE_PREDICTION_BY_ID, [prediction_id])
      .then((response) => response.rows[0]);
  };

const closePredictionById = (client: PoolClient) =>
  function (
    prediction_id: number | string,
    triggerer_id: number | string | null,
    closed_date: Date
  ): Promise<APIPredictions.ClosePredictionById> {
    return client
      .query<null>(CLOSE_PREDICTION_BY_ID, [
        prediction_id,
        triggerer_id,
        closed_date,
      ])
      .then((response) => response.rows[0]);
  };

const judgePredictionById = (client: PoolClient) =>
  function (
    prediction_id: number | string
  ): Promise<APIPredictions.JudgePredictionById> {
    return client
      .query<null>(JUDGE_PREDICTION_BY_ID, [prediction_id])
      .then((response) => response.rows[0]);
  };

const getNextPredictionToTrigger = (client: PoolClient) =>
  function (): Promise<APIPredictions.GetNextPredictionToTrigger | undefined> {
    return client
      .query<APIPredictions.GetNextPredictionToTrigger>(
        GET_NEXT_PREDICTION_TO_TRIGGER
      )
      .then((res) => res.rows[0]);
  };

const getNextPredictionToJudge = (client: PoolClient) =>
  function (): Promise<APIPredictions.GetNextPredictionToJudge | undefined> {
    return client
      .query<APIPredictions.GetNextPredictionToJudge>(
        GET_NEXT_PREDICTION_TO_JUDGE
      )
      .then((res) => res.rows[0]);
  };

export default {
  add,
  getByPredictionId,
  retirePredictionById,
  closePredictionById,
  judgePredictionById,
  getNextPredictionToTrigger,
  getNextPredictionToJudge,
};
