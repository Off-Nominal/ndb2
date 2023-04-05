import { PoolClient } from "pg";
import { APIPredictions, PredictionLifeCycle } from "../types/predicitions";

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

export enum SortByOption {
  CREATED_ASC = "created_date-asc",
  CREATED_DESC = "created_date-desc",
  DUE_ASC = "due_date-asc",
  DUE_DESC = "due_date-desc",
  RETIRED_ASC = "retired_date-asc",
  RETIRED_DESC = "retired_date-desc",
  TRIGGERED_ASC = "triggered_date-asc",
  TRIGGERED_DESC = "triggered_date-desc",
  CLOSED_ASC = "closed_date-asc",
  CLOSED_DESC = "closed_date-desc",
  JUDGED_ASC = "judged_date-asc",
  JUDGED_DESC = "judged_date-desc",
}

export type SearchOptions = {
  keyword?: string;
  page?: number | string;
  status?: PredictionLifeCycle;
  sort_by?: SortByOption;
};

const generate_SEARCH_PREDICTIONS = (options: SearchOptions) => {
  const page = options.page || 0;
  const offset = `OFFSET (${page}) * 10`;

  const hasWhereClause =
    options.status ||
    options.sort_by === SortByOption.RETIRED_ASC ||
    options.sort_by === SortByOption.RETIRED_DESC ||
    options.sort_by === SortByOption.TRIGGERED_ASC ||
    options.sort_by === SortByOption.TRIGGERED_DESC ||
    options.sort_by === SortByOption.CLOSED_ASC ||
    options.sort_by === SortByOption.CLOSED_DESC ||
    options.sort_by === SortByOption.JUDGED_ASC ||
    options.sort_by === SortByOption.JUDGED_DESC;

  let whereClause = hasWhereClause ? "WHERE " : "";

  const whereClauses = [];

  if (options.status) {
    whereClauses.push(`ep.status = '${options.status}'`);
  }

  switch (options.sort_by) {
    case SortByOption.RETIRED_ASC:
    case SortByOption.RETIRED_DESC: {
      whereClauses.push(`ep.retired_date IS NOT NULL`);
      break;
    }
    case SortByOption.TRIGGERED_ASC:
    case SortByOption.TRIGGERED_DESC: {
      whereClauses.push(`ep.triggered_date IS NOT NULL`);
      break;
    }
    case SortByOption.CLOSED_ASC:
    case SortByOption.CLOSED_DESC: {
      whereClauses.push(`ep.closed_date IS NOT NULL`);
      break;
    }
    case SortByOption.JUDGED_ASC:
    case SortByOption.JUDGED_DESC: {
      whereClauses.push(`ep.judged_date IS NOT NULL`);
      break;
    }
  }

  whereClause += whereClauses.join(" AND ");

  const sortByOptions = {
    [SortByOption.CREATED_ASC]: `ORDER BY ep.created_date ASC`,
    [SortByOption.CREATED_DESC]: `ORDER BY ep.created_date DESC`,
    [SortByOption.DUE_ASC]: `ORDER BY ep.due_date ASC`,
    [SortByOption.DUE_DESC]: `ORDER BY ep.due_date DESC`,
    [SortByOption.RETIRED_ASC]: `ORDER BY ep.retired_date ASC`,
    [SortByOption.RETIRED_DESC]: `ORDER BY ep.retired_date DESC`,
    [SortByOption.TRIGGERED_ASC]: `ORDER BY ep.triggered_date ASC`,
    [SortByOption.TRIGGERED_DESC]: `ORDER BY ep.triggered_date DESC`,
    [SortByOption.CLOSED_ASC]: `ORDER BY ep.closed_date ASC`,
    [SortByOption.CLOSED_DESC]: `ORDER BY ep.closed_date DESC`,
    [SortByOption.JUDGED_ASC]: `ORDER BY ep.judged_date ASC`,
    [SortByOption.JUDGED_DESC]: `ORDER BY ep.judged_date DESC`,
  };

  return `
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
      (SELECT row_to_json(payout_sum)
      FROM(
        SELECT ep.endorsement_ratio as endorse, ep.undorsement_ratio as undorse
      ) payout_sum
    ) as payouts
    FROM enhanced_predictions ep
    ${whereClause}
    ${options.sort_by ? sortByOptions[options.sort_by] : ""}
    LIMIT 10
    ${offset}`;
};

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

const searchPredictions = (client: PoolClient) =>
  function (
    options: SearchOptions
  ): Promise<APIPredictions.SearchPredictions[]> {
    return client
      .query<APIPredictions.SearchPredictions>(
        generate_SEARCH_PREDICTIONS(options)
      )
      .then((res) => res.rows);
  };

export default {
  add,
  getByPredictionId,
  retirePredictionById,
  closePredictionById,
  judgePredictionById,
  getNextPredictionToTrigger,
  getNextPredictionToJudge,
  searchPredictions,
};
