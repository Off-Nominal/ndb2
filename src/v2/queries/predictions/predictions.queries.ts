/** Types generated for queries found in "src/v2/queries/predictions/predictions.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type prediction_driver = 'date' | 'event';

export type prediction_status = 'checking' | 'closed' | 'failed' | 'open' | 'retired' | 'successful';

/** 'GetPredictionsById' parameters type */
export interface IGetPredictionsByIdParams {
  prediction_id: number;
}

/** 'GetPredictionsById' return type */
export interface IGetPredictionsByIdResult {
  check_date: Date | null;
  closed_date: Date | null;
  created_date: Date;
  driver: prediction_driver;
  due_date: Date | null;
  endorse: string;
  id: number;
  judged_date: Date | null;
  last_check_date: Date | null;
  predictor_discord_id: string;
  predictor_id: string;
  retired_date: Date | null;
  season_applicable: boolean;
  season_id: number | null;
  status: prediction_status | null;
  text: string;
  trigerer_discord_id: string;
  triggered_date: Date | null;
  triggerer_id: string | null;
  undorse: string;
}

/** 'GetPredictionsById' query type */
export interface IGetPredictionsByIdQuery {
  params: IGetPredictionsByIdParams;
  result: IGetPredictionsByIdResult;
}

const getPredictionsByIdIR: any = {"usedParamSet":{"prediction_id":true},"params":[{"name":"prediction_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":569,"b":583}]}],"statement":"SELECT\n    p.id,\n    p.user_id as predictor_id,\n    u.discord_id as predictor_discord_id,\n    p.text,\n    p.driver,\n    p.season_id,\n    p.season_applicable,\n    p.created_date,\n    p.due_date,\n    p.check_date,\n    p.last_check_date,\n    p.closed_date,\n    p.triggered_date,\n    p.triggerer_id,\n    t.discord_id as trigerer_discord_id,\n    p.judged_date,\n    p.retired_date,\n    p.status,\n    p.endorse_ratio as endorse,\n    p.undorse_ratio as undorse\n  FROM predictions p\n  JOIN users u ON u.id = p.user_id\n  LEFT JOIN users t ON t.id = p.triggerer_id\n  WHERE p.id = :prediction_id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *     p.id,
 *     p.user_id as predictor_id,
 *     u.discord_id as predictor_discord_id,
 *     p.text,
 *     p.driver,
 *     p.season_id,
 *     p.season_applicable,
 *     p.created_date,
 *     p.due_date,
 *     p.check_date,
 *     p.last_check_date,
 *     p.closed_date,
 *     p.triggered_date,
 *     p.triggerer_id,
 *     t.discord_id as trigerer_discord_id,
 *     p.judged_date,
 *     p.retired_date,
 *     p.status,
 *     p.endorse_ratio as endorse,
 *     p.undorse_ratio as undorse
 *   FROM predictions p
 *   JOIN users u ON u.id = p.user_id
 *   LEFT JOIN users t ON t.id = p.triggerer_id
 *   WHERE p.id = :prediction_id!
 * ```
 */
export const getPredictionsById = new PreparedQuery<IGetPredictionsByIdParams,IGetPredictionsByIdResult>(getPredictionsByIdIR);


/** 'UntriggerPredictionById' parameters type */
export interface IUntriggerPredictionByIdParams {
  prediction_id: number;
}

/** 'UntriggerPredictionById' return type */
export type IUntriggerPredictionByIdResult = void;

/** 'UntriggerPredictionById' query type */
export interface IUntriggerPredictionByIdQuery {
  params: IUntriggerPredictionByIdParams;
  result: IUntriggerPredictionByIdResult;
}

const untriggerPredictionByIdIR: any = {"usedParamSet":{"prediction_id":true},"params":[{"name":"prediction_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":104,"b":118}]}],"statement":"UPDATE predictions SET \n  triggerer_id = NULL,\n  triggered_date = NULL,\n  closed_date = NULL\nWHERE id = :prediction_id!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE predictions SET 
 *   triggerer_id = NULL,
 *   triggered_date = NULL,
 *   closed_date = NULL
 * WHERE id = :prediction_id!
 * ```
 */
export const untriggerPredictionById = new PreparedQuery<IUntriggerPredictionByIdParams,IUntriggerPredictionByIdResult>(untriggerPredictionByIdIR);


