/** Types generated for queries found in "src/v2/queries/predictions/predictions.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type prediction_driver = 'date' | 'event';

export type prediction_status = 'checking' | 'closed' | 'failed' | 'open' | 'retired' | 'successful';

export type DateOrString = Date | string;

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
  status: prediction_status;
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


/** 'RetirePredictionById' parameters type */
export interface IRetirePredictionByIdParams {
  prediction_id: number;
}

/** 'RetirePredictionById' return type */
export type IRetirePredictionByIdResult = void;

/** 'RetirePredictionById' query type */
export interface IRetirePredictionByIdQuery {
  params: IRetirePredictionByIdParams;
  result: IRetirePredictionByIdResult;
}

const retirePredictionByIdIR: any = {"usedParamSet":{"prediction_id":true},"params":[{"name":"prediction_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":73,"b":87}]}],"statement":"UPDATE predictions \n  SET retired_date = NOW() \n  WHERE predictions.id = :prediction_id!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE predictions 
 *   SET retired_date = NOW() 
 *   WHERE predictions.id = :prediction_id!
 * ```
 */
export const retirePredictionById = new PreparedQuery<IRetirePredictionByIdParams,IRetirePredictionByIdResult>(retirePredictionByIdIR);


/** 'InsertEventDrivenPrediction' parameters type */
export interface IInsertEventDrivenPredictionParams {
  check_date: DateOrString;
  created_date: DateOrString;
  text: string;
  user_id: string;
}

/** 'InsertEventDrivenPrediction' return type */
export interface IInsertEventDrivenPredictionResult {
  id: number;
}

/** 'InsertEventDrivenPrediction' query type */
export interface IInsertEventDrivenPredictionQuery {
  params: IInsertEventDrivenPredictionParams;
  result: IInsertEventDrivenPredictionResult;
}

const insertEventDrivenPredictionIR: any = {"usedParamSet":{"user_id":true,"text":true,"created_date":true,"check_date":true},"params":[{"name":"user_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":97,"b":105}]},{"name":"text","required":true,"transform":{"type":"scalar"},"locs":[{"a":110,"b":115}]},{"name":"created_date","required":true,"transform":{"type":"scalar"},"locs":[{"a":120,"b":133}]},{"name":"check_date","required":true,"transform":{"type":"scalar"},"locs":[{"a":149,"b":160}]}],"statement":"INSERT INTO predictions (\n  user_id,\n  text,\n  created_date,\n  driver,\n  check_date\n) VALUES (\n  :user_id!,\n  :text!,\n  :created_date!,\n  'event',\n  :check_date!\n) RETURNING id"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO predictions (
 *   user_id,
 *   text,
 *   created_date,
 *   driver,
 *   check_date
 * ) VALUES (
 *   :user_id!,
 *   :text!,
 *   :created_date!,
 *   'event',
 *   :check_date!
 * ) RETURNING id
 * ```
 */
export const insertEventDrivenPrediction = new PreparedQuery<IInsertEventDrivenPredictionParams,IInsertEventDrivenPredictionResult>(insertEventDrivenPredictionIR);


/** 'InsertDateDrivenPrediction' parameters type */
export interface IInsertDateDrivenPredictionParams {
  created_date: DateOrString;
  due_date: DateOrString;
  text: string;
  user_id: string;
}

/** 'InsertDateDrivenPrediction' return type */
export interface IInsertDateDrivenPredictionResult {
  id: number;
}

/** 'InsertDateDrivenPrediction' query type */
export interface IInsertDateDrivenPredictionQuery {
  params: IInsertDateDrivenPredictionParams;
  result: IInsertDateDrivenPredictionResult;
}

const insertDateDrivenPredictionIR: any = {"usedParamSet":{"user_id":true,"text":true,"created_date":true,"due_date":true},"params":[{"name":"user_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":95,"b":103}]},{"name":"text","required":true,"transform":{"type":"scalar"},"locs":[{"a":108,"b":113}]},{"name":"created_date","required":true,"transform":{"type":"scalar"},"locs":[{"a":118,"b":131}]},{"name":"due_date","required":true,"transform":{"type":"scalar"},"locs":[{"a":146,"b":155}]}],"statement":"INSERT INTO predictions (\n  user_id,\n  text,\n  created_date,\n  driver,\n  due_date\n) VALUES (\n  :user_id!,\n  :text!,\n  :created_date!,\n  'date',\n  :due_date!\n) RETURNING id"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO predictions (
 *   user_id,
 *   text,
 *   created_date,
 *   driver,
 *   due_date
 * ) VALUES (
 *   :user_id!,
 *   :text!,
 *   :created_date!,
 *   'date',
 *   :due_date!
 * ) RETURNING id
 * ```
 */
export const insertDateDrivenPrediction = new PreparedQuery<IInsertDateDrivenPredictionParams,IInsertDateDrivenPredictionResult>(insertDateDrivenPredictionIR);


