import { PoolClient } from "pg";
import { APIPredictions, PredictionDriver } from "../../types/predicitions";
import {
  generate_SEARCH_PREDICTIONS,
  SearchOptions,
} from "./predictions_search";
import sqlFileLoader from ".";

const ADD_DATE_DRIVEN_PREDICTION = `
  INSERT INTO predictions (
    user_id,
    text,
    created_date,
    driver,
    due_date
  ) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
  ) RETURNING id
`;

const ADD_EVENT_DRIVEN_PREDICTION = `
  INSERT INTO predictions (
    user_id,
    text,
    created_date,
    driver,
    check_date
  ) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
  ) RETURNING id
`;

const addPredictionQueries: Record<PredictionDriver, string> = {
  event: ADD_EVENT_DRIVEN_PREDICTION,
  date: ADD_DATE_DRIVEN_PREDICTION,
};

// export const GET_ENHANCED_PREDICTION_BY_ID = `
//   SELECT
//     p.id,
//     (SELECT row_to_json(pred) FROM
//         (SELECT
//             p.user_id as id,
//             u.discord_id
//           FROM users u
//           WHERE u.id = p.user_id)
//       pred)
//     as predictor,
//     p.text,
//     p.driver,
//     p.season_id,
//     p.season_applicable,
//     p.created_date,
//     p.due_date,
//     p.check_date,
//     p.last_check_date,
//     p.closed_date,
//     p.triggered_date,
//     (SELECT row_to_json(trig) FROM
//         (SELECT
//             p.triggerer_id as id,
//             u.discord_id
//           FROM users u
//           WHERE u.id = p.triggerer_id)
//       trig)
//     as triggerer,
//     p.judged_date,
//     p.retired_date,
//     p.status,
//     (SELECT
//       COALESCE(jsonb_agg(p_bets), '[]')
//       FROM
//         (SELECT
//           b.id,
//           (SELECT row_to_json(bett) FROM
//             (SELECT
//                 u.id,
//                 u.discord_id
//               FROM users u
//               WHERE u.id = b.user_id)
//             bett)
//           as better,
//           b.date,
//           b.endorsed,
//           b.wager,
//           b.valid,
//           b.payout,
//           b.season_payout
//           FROM bets b
//           WHERE b.prediction_id = p.id
//           ORDER BY date ASC
//         ) p_bets
//   ) as bets,
//   (SELECT
//     COALESCE(jsonb_agg(p_votes), '[]')
//     FROM
//       (SELECT
//           id,
//           (SELECT row_to_json(vott) FROM
//             (SELECT
//                 u.id,
//                 u.discord_id
//               FROM users u
//               WHERE u.id = v.user_id)
//             vott)
//           as voter,
//           voted_date,
//           vote
//         FROM votes v
//         WHERE v.prediction_id = p.id
//         ORDER BY voted_date DESC
//       ) p_votes
//   ) as votes,
//   (SELECT
//     COALESCE(jsonb_agg(p_snooze_checks), '[]')
//     FROM
//       (SELECT
//           sc.id,
//           sc.check_date,
//           sc.closed,
//           sc.closed_at,
//           (SELECT row_to_json(vals)
//             FROM(
//               SELECT
//                 COUNT(sv.*) FILTER (WHERE sv.value = 0) as trigger,
//                 COUNT(sv.*) FILTER (WHERE sv.value = 1) as day,
//                 COUNT(sv.*) FILTER (WHERE sv.value = 7) as week,
//                 COUNT(sv.*) FILTER (WHERE sv.value = 30) as month,
//                 COUNT(sv.*) FILTER (WHERE sv.value = 90) as quarter,
//                 COUNT(sv.*) FILTER (WHERE sv.value = 365) as year
//               FROM snooze_votes sv
//               WHERE sv.snooze_check_id = sc.id
//             ) vals
//           ) as values
//         FROM snooze_checks sc
//         WHERE sc.prediction_id = p.id
//         ORDER BY sc.check_date DESC
//       ) p_snooze_checks
//   ) as checks,
//   (SELECT row_to_json(payout_sum)
//     FROM(
//       SELECT p.endorse_ratio as endorse, p.undorse_ratio as undorse
//     ) payout_sum
//   ) as payouts
//   FROM predictions p
//   WHERE p.id = $1
// `;

const RETIRE_PREDICTION_BY_ID = `
  UPDATE predictions SET retired_date = NOW() WHERE predictions.id = $1;
`;

export const CLOSE_PREDICTION_BY_ID = `
  UPDATE predictions SET triggerer_id = $2, closed_date = $3, triggered_date = NOW() WHERE predictions.id = $1;
`;

const JUDGE_PREDICTION_BY_ID = `
  UPDATE predictions SET judged_date = NOW() WHERE predictions.id = $1;
`;

export const SNOOZE_PREDICTION_BY_ID = `
  UPDATE predictions SET check_date = predictions.check_date + interval '$2 day' WHERE predictions.id = $1;
`;

const GET_NEXT_PREDICTION_TO_TRIGGER = `
  SELECT 
    id, 
    due_date 
  FROM predictions 
  WHERE driver = 'date' 
    AND due_date < NOW() 
    AND status = 'open'
  ORDER BY due_date ASC LIMIT 1
`;

const GET_NEXT_PREDICTION_TO_JUDGE = `
  SELECT 
    id 
  FROM predictions 
  WHERE status = 'closed'
    AND triggered_date + '1 day' < NOW() 
  ORDER BY due_date ASC LIMIT 1
`;

const GET_NEXT_PREDICTION_TO_CHECK = `
  SELECT 
    id, 
    check_date 
  FROM predictions 
  WHERE driver = 'event' 
    AND check_date < NOW() 
    AND status = 'open' 
  ORDER BY check_date ASC LIMIT 1
`;

const add = (client: PoolClient) =>
  function (
    user_id: string,
    text: string,
    drive_date: Date,
    created_date: Date = new Date(),
    driver: PredictionDriver
  ): Promise<APIPredictions.AddPrediction> {
    const query = addPredictionQueries[driver];
    if (!query) {
      throw new Error(`Invalid driver: ${driver}`);
    }

    return client
      .query<APIPredictions.AddPrediction>(query, [
        user_id,
        text,
        created_date,
        driver,
        drive_date,
      ])
      .then((response) => response.rows[0]);
  };

const getPredictionById = (client: PoolClient) =>
  function (
    prediction_id: number | string
  ): Promise<APIPredictions.GetPredictionById | null> {
    const query = sqlFileLoader.get("GetPredictionById");

    return client
      .query<APIPredictions.GetPredictionById>(query, [prediction_id])
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

const getNextPredictionToCheck = (client: PoolClient) =>
  function (): Promise<APIPredictions.GetNextPredictionToCheck | undefined> {
    return client
      .query<APIPredictions.GetNextPredictionToCheck>(
        GET_NEXT_PREDICTION_TO_CHECK
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

const searchPredictions = (client: PoolClient) =>
  function (
    options: SearchOptions
  ): Promise<APIPredictions.SearchPredictions[]> {
    const [query, params] = generate_SEARCH_PREDICTIONS(options);
    return client
      .query<APIPredictions.SearchPredictions>(query, params)
      .then((res) => res.rows);
  };

export default {
  add,
  getPredictionById,
  retirePredictionById,
  closePredictionById,
  judgePredictionById,
  getNextPredictionToTrigger,
  getNextPredictionToCheck,
  getNextPredictionToJudge,
  searchPredictions,
};
