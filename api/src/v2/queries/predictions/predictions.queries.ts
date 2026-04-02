/** Types generated for queries found in "src/v2/queries/predictions/predictions.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type prediction_driver = 'date' | 'event';

export type prediction_status = 'checking' | 'closed' | 'failed' | 'open' | 'retired' | 'successful';

export type DateOrString = Date | string;

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export type NumberOrString = number | string;

export type stringArray = (string)[];

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


/** 'UnjudgePredictionById' parameters type */
export interface IUnjudgePredictionByIdParams {
  prediction_id: number;
}

/** 'UnjudgePredictionById' return type */
export type IUnjudgePredictionByIdResult = void;

/** 'UnjudgePredictionById' query type */
export interface IUnjudgePredictionByIdQuery {
  params: IUnjudgePredictionByIdParams;
  result: IUnjudgePredictionByIdResult;
}

const unjudgePredictionByIdIR: any = {"usedParamSet":{"prediction_id":true},"params":[{"name":"prediction_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":66,"b":80},{"a":209,"b":223}]}],"statement":"WITH deleted_votes AS (\n  DELETE FROM votes WHERE prediction_id = :prediction_id!\n)\nUPDATE predictions\nSET\n  judged_date = NULL,\n  closed_date = NULL,\n  triggered_date = NULL,\n  triggerer_id = NULL\nWHERE id = :prediction_id!"};

/**
 * Query generated from SQL:
 * ```
 * WITH deleted_votes AS (
 *   DELETE FROM votes WHERE prediction_id = :prediction_id!
 * )
 * UPDATE predictions
 * SET
 *   judged_date = NULL,
 *   closed_date = NULL,
 *   triggered_date = NULL,
 *   triggerer_id = NULL
 * WHERE id = :prediction_id!
 * ```
 */
export const unjudgePredictionById = new PreparedQuery<IUnjudgePredictionByIdParams,IUnjudgePredictionByIdResult>(unjudgePredictionByIdIR);


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

const insertDateDrivenPredictionIR: any = {"usedParamSet":{"user_id":true,"text":true,"created_date":true,"due_date":true},"params":[{"name":"user_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":95,"b":103}]},{"name":"text","required":true,"transform":{"type":"scalar"},"locs":[{"a":108,"b":113}]},{"name":"created_date","required":true,"transform":{"type":"scalar"},"locs":[{"a":118,"b":131}]},{"name":"due_date","required":true,"transform":{"type":"scalar"},"locs":[{"a":146,"b":155}]}],"statement":"INSERT INTO predictions (\n  user_id,\n  text,\n  created_date,\n  driver,\n  due_date\n) VALUES (\n  :user_id!,\n  :text!,\n  :created_date!,\n  'date',\n  :due_date!\n) RETURNING id                                                                                                                                                                                                                                                                                                             "};

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


/** 'SearchPredictions' parameters type */
export interface ISearchPredictionsParams {
  include_non_applicable?: boolean | null | void;
  keyword?: string | null | void;
  non_better_id?: string | null | void;
  predictor_id?: string | null | void;
  row_offset: NumberOrString;
  season_id?: number | null | void;
  sort_by?: string | null | void;
  statuses?: stringArray | null | void;
}

/** 'SearchPredictions' return type */
export interface ISearchPredictionsResult {
  bets: Json | null;
  check_date: Date | null;
  closed_date: Date | null;
  created_date: Date;
  driver: prediction_driver;
  due_date: Date | null;
  id: number;
  judged_date: Date | null;
  last_check_date: Date | null;
  payouts: Json | null;
  predictor: Json | null;
  retired_date: Date | null;
  season_applicable: boolean;
  season_id: number | null;
  status: prediction_status;
  text: string;
  triggered_date: Date | null;
  triggerer: Json | null;
  votes: Json | null;
}

/** 'SearchPredictions' query type */
export interface ISearchPredictionsQuery {
  params: ISearchPredictionsParams;
  result: ISearchPredictionsResult;
}

const searchPredictionsIR: any = {"usedParamSet":{"statuses":true,"predictor_id":true,"non_better_id":true,"season_id":true,"include_non_applicable":true,"keyword":true,"sort_by":true,"row_offset":true},"params":[{"name":"statuses","required":false,"transform":{"type":"scalar"},"locs":[{"a":1399,"b":1407},{"a":1452,"b":1460}]},{"name":"predictor_id","required":false,"transform":{"type":"scalar"},"locs":[{"a":1473,"b":1485},{"a":1518,"b":1530}]},{"name":"non_better_id","required":false,"transform":{"type":"scalar"},"locs":[{"a":1542,"b":1555},{"a":1663,"b":1676}]},{"name":"season_id","required":false,"transform":{"type":"scalar"},"locs":[{"a":1692,"b":1701},{"a":1745,"b":1754}]},{"name":"include_non_applicable","required":false,"transform":{"type":"scalar"},"locs":[{"a":1772,"b":1794}]},{"name":"keyword","required":false,"transform":{"type":"scalar"},"locs":[{"a":1867,"b":1874},{"a":1917,"b":1924}]},{"name":"sort_by","required":false,"transform":{"type":"scalar"},"locs":[{"a":1968,"b":1975},{"a":2060,"b":2067},{"a":2154,"b":2161},{"a":2238,"b":2245},{"a":2324,"b":2331},{"a":2412,"b":2419},{"a":2502,"b":2509},{"a":2594,"b":2601},{"a":2688,"b":2695},{"a":2784,"b":2791},{"a":2882,"b":2889},{"a":2972,"b":2979},{"a":3064,"b":3071},{"a":3154,"b":3161}]},{"name":"row_offset","required":true,"transform":{"type":"scalar"},"locs":[{"a":3259,"b":3270}]}],"statement":"SELECT\n  p.id,\n  (SELECT row_to_json(pred) FROM\n      (SELECT\n          p.user_id as id,\n          u.discord_id\n        FROM users u\n        WHERE u.id = p.user_id)\n    pred)\n  as predictor,\n  p.text,\n  p.driver,\n  p.season_id,\n  p.season_applicable,\n  p.created_date,\n  p.due_date,\n  p.check_date,\n  p.last_check_date,\n  p.closed_date,\n  p.triggered_date,\n  (SELECT row_to_json(trig) FROM\n      (SELECT\n          p.triggerer_id as id,\n          u.discord_id\n        FROM users u\n        WHERE u.id = p.triggerer_id)\n    trig)\n  as triggerer,\n  p.judged_date,\n  p.retired_date,\n  p.status,\n  (SELECT row_to_json(bs) FROM\n      (SELECT\n        COUNT(b.id) FILTER (WHERE b.endorsed IS TRUE AND b.valid IS TRUE) as endorsements,\n        COUNT(b.id) FILTER (WHERE b.endorsed IS FALSE AND b.valid IS TRUE) as undorsements,\n        COUNT(b.id) FILTER (WHERE b.valid IS FALSE) as invalid\n        FROM bets b\n        WHERE b.prediction_id = p.id\n      ) bs\n  ) as bets,\n  (SELECT row_to_json(vs) FROM\n      (SELECT\n        COUNT(v.id) FILTER (WHERE v.vote IS TRUE) as yes,\n        COUNT(v.id) FILTER (WHERE v.vote IS FALSE) as no\n        FROM votes v\n        WHERE v.prediction_id = p.id\n      ) vs\n  ) as votes,\n  (SELECT row_to_json(payout_sum)\n    FROM(\n      SELECT p.endorse_ratio as endorse, p.undorse_ratio as undorse\n    ) payout_sum\n  ) as payouts\nFROM predictions p\nWHERE (\n  COALESCE(cardinality(:statuses::text[]), 0) = 0\n  OR p.status::text = ANY(:statuses)\n)\nAND (\n  :predictor_id::uuid IS NULL\n  OR p.user_id = :predictor_id\n)\nAND (\n  :non_better_id::uuid IS NULL\n  OR NOT EXISTS (\n    SELECT 1 FROM bets b\n    WHERE b.prediction_id = p.id AND b.user_id = :non_better_id\n  )\n)\nAND (\n  :season_id::integer IS NULL\n  OR (\n    p.season_id = :season_id\n    AND (\n      :include_non_applicable\n      OR p.season_applicable IS TRUE\n    )\n  )\n)\nORDER BY\n  (CASE WHEN :keyword::text IS NULL THEN NULL ELSE (p.text <-> :keyword::text) END) ASC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'created_date-asc' THEN p.created_date END ) ASC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'created_date-desc' THEN p.created_date END ) DESC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'due_date-asc' THEN p.due_date END ) ASC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'due_date-desc' THEN p.due_date END ) DESC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'check_date-asc' THEN p.check_date END ) ASC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'check_date-desc' THEN p.check_date END ) DESC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'retired_date-asc' THEN p.retired_date END ) ASC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'retired_date-desc' THEN p.retired_date END ) DESC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'triggered_date-asc' THEN p.triggered_date END ) ASC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'triggered_date-desc' THEN p.triggered_date END ) DESC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'closed_date-asc' THEN p.closed_date END ) ASC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'closed_date-desc' THEN p.closed_date END ) DESC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'judged_date-asc' THEN p.judged_date END ) ASC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'judged_date-desc' THEN p.judged_date END ) DESC NULLS LAST,\n  p.id ASC\nLIMIT 10\nOFFSET :row_offset!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   p.id,
 *   (SELECT row_to_json(pred) FROM
 *       (SELECT
 *           p.user_id as id,
 *           u.discord_id
 *         FROM users u
 *         WHERE u.id = p.user_id)
 *     pred)
 *   as predictor,
 *   p.text,
 *   p.driver,
 *   p.season_id,
 *   p.season_applicable,
 *   p.created_date,
 *   p.due_date,
 *   p.check_date,
 *   p.last_check_date,
 *   p.closed_date,
 *   p.triggered_date,
 *   (SELECT row_to_json(trig) FROM
 *       (SELECT
 *           p.triggerer_id as id,
 *           u.discord_id
 *         FROM users u
 *         WHERE u.id = p.triggerer_id)
 *     trig)
 *   as triggerer,
 *   p.judged_date,
 *   p.retired_date,
 *   p.status,
 *   (SELECT row_to_json(bs) FROM
 *       (SELECT
 *         COUNT(b.id) FILTER (WHERE b.endorsed IS TRUE AND b.valid IS TRUE) as endorsements,
 *         COUNT(b.id) FILTER (WHERE b.endorsed IS FALSE AND b.valid IS TRUE) as undorsements,
 *         COUNT(b.id) FILTER (WHERE b.valid IS FALSE) as invalid
 *         FROM bets b
 *         WHERE b.prediction_id = p.id
 *       ) bs
 *   ) as bets,
 *   (SELECT row_to_json(vs) FROM
 *       (SELECT
 *         COUNT(v.id) FILTER (WHERE v.vote IS TRUE) as yes,
 *         COUNT(v.id) FILTER (WHERE v.vote IS FALSE) as no
 *         FROM votes v
 *         WHERE v.prediction_id = p.id
 *       ) vs
 *   ) as votes,
 *   (SELECT row_to_json(payout_sum)
 *     FROM(
 *       SELECT p.endorse_ratio as endorse, p.undorse_ratio as undorse
 *     ) payout_sum
 *   ) as payouts
 * FROM predictions p
 * WHERE (
 *   COALESCE(cardinality(:statuses::text[]), 0) = 0
 *   OR p.status::text = ANY(:statuses)
 * )
 * AND (
 *   :predictor_id::uuid IS NULL
 *   OR p.user_id = :predictor_id
 * )
 * AND (
 *   :non_better_id::uuid IS NULL
 *   OR NOT EXISTS (
 *     SELECT 1 FROM bets b
 *     WHERE b.prediction_id = p.id AND b.user_id = :non_better_id
 *   )
 * )
 * AND (
 *   :season_id::integer IS NULL
 *   OR (
 *     p.season_id = :season_id
 *     AND (
 *       :include_non_applicable
 *       OR p.season_applicable IS TRUE
 *     )
 *   )
 * )
 * ORDER BY
 *   (CASE WHEN :keyword::text IS NULL THEN NULL ELSE (p.text <-> :keyword::text) END) ASC NULLS LAST,
 *   ( CASE WHEN :sort_by::text = 'created_date-asc' THEN p.created_date END ) ASC NULLS LAST,
 *   ( CASE WHEN :sort_by::text = 'created_date-desc' THEN p.created_date END ) DESC NULLS LAST,
 *   ( CASE WHEN :sort_by::text = 'due_date-asc' THEN p.due_date END ) ASC NULLS LAST,
 *   ( CASE WHEN :sort_by::text = 'due_date-desc' THEN p.due_date END ) DESC NULLS LAST,
 *   ( CASE WHEN :sort_by::text = 'check_date-asc' THEN p.check_date END ) ASC NULLS LAST,
 *   ( CASE WHEN :sort_by::text = 'check_date-desc' THEN p.check_date END ) DESC NULLS LAST,
 *   ( CASE WHEN :sort_by::text = 'retired_date-asc' THEN p.retired_date END ) ASC NULLS LAST,
 *   ( CASE WHEN :sort_by::text = 'retired_date-desc' THEN p.retired_date END ) DESC NULLS LAST,
 *   ( CASE WHEN :sort_by::text = 'triggered_date-asc' THEN p.triggered_date END ) ASC NULLS LAST,
 *   ( CASE WHEN :sort_by::text = 'triggered_date-desc' THEN p.triggered_date END ) DESC NULLS LAST,
 *   ( CASE WHEN :sort_by::text = 'closed_date-asc' THEN p.closed_date END ) ASC NULLS LAST,
 *   ( CASE WHEN :sort_by::text = 'closed_date-desc' THEN p.closed_date END ) DESC NULLS LAST,
 *   ( CASE WHEN :sort_by::text = 'judged_date-asc' THEN p.judged_date END ) ASC NULLS LAST,
 *   ( CASE WHEN :sort_by::text = 'judged_date-desc' THEN p.judged_date END ) DESC NULLS LAST,
 *   p.id ASC
 * LIMIT 10
 * OFFSET :row_offset!
 * ```
 */
export const searchPredictions = new PreparedQuery<ISearchPredictionsParams,ISearchPredictionsResult>(searchPredictionsIR);


