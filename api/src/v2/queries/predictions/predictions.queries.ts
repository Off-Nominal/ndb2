/** Types generated for queries found in "src/v2/queries/predictions/predictions.sql" */
import { PreparedQuery } from '@pgtyped/runtime';
import type { IGetBetsByPredictionIdResult } from '../bets/bets.queries';
import type { IGetSnoozeChecksByPredictionIdResult } from '../snooze_checks/snooze_checks.queries';
import type { IGetVotesByPredictionIdResult } from '../votes/votes.queries';

export type prediction_driver = 'date' | 'event';

export type prediction_status = 'checking' | 'closed' | 'failed' | 'open' | 'retired' | 'successful';

export type DateOrString = Date | string;

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


/** 'GetPredictionDetailById' parameters type */
export interface IGetPredictionDetailByIdParams {
  prediction_id: number;
}

/** 'GetPredictionDetailById' return type */
export interface IGetPredictionDetailByIdResult extends IGetPredictionsByIdResult {
  bets_json: IGetBetsByPredictionIdResult[];
  checks_json: IGetSnoozeChecksByPredictionIdResult[];
  votes_json: IGetVotesByPredictionIdResult[];
}

/** 'GetPredictionDetailById' query type */
export interface IGetPredictionDetailByIdQuery {
  params: IGetPredictionDetailByIdParams;
  result: IGetPredictionDetailByIdResult;
}

const getPredictionDetailByIdIR: any = {"usedParamSet":{"prediction_id":true},"params":[{"name":"prediction_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":638,"b":653},{"a":1276,"b":1291},{"a":1780,"b":1795},{"a":2969,"b":2984}]}],"statement":"WITH\n  pred AS (\n    SELECT\n      p.id,\n      p.user_id AS predictor_id,\n      u.discord_id AS predictor_discord_id,\n      p.text,\n      p.driver,\n      p.season_id,\n      p.season_applicable,\n      p.created_date,\n      p.due_date,\n      p.check_date,\n      p.last_check_date,\n      p.closed_date,\n      p.triggered_date,\n      p.triggerer_id,\n      t.discord_id AS trigerer_discord_id,\n      p.judged_date,\n      p.retired_date,\n      p.status,\n      p.endorse_ratio AS endorse,\n      p.undorse_ratio AS undorse\n    FROM predictions p\n    JOIN users u ON u.id = p.user_id\n    LEFT JOIN users t ON t.id = p.triggerer_id\n    WHERE p.id = :prediction_id!\n  ),\n  bets AS (\n    SELECT\n      COALESCE(\n        json_agg(\n          json_build_object(\n            'id', b.id,\n            'prediction_id', b.prediction_id,\n            'better_id', b.user_id,\n            'better_discord_id', bu.discord_id,\n            'date', b.date,\n            'endorsed', b.endorsed,\n            'wager', b.wager,\n            'valid', b.valid,\n            'payout', b.payout,\n            'season_payout', b.season_payout\n          )\n          ORDER BY b.date ASC\n        ),\n        '[]'::json\n      ) AS bets_json\n    FROM bets b\n    JOIN users bu ON bu.id = b.user_id\n    WHERE b.prediction_id = :prediction_id!\n  ),\n  votes AS (\n    SELECT\n      COALESCE(\n        json_agg(\n          json_build_object(\n            'id', v.id,\n            'prediction_id', v.prediction_id,\n            'voter_id', u.id,\n            'voter_discord_id', u.discord_id,\n            'voted_date', v.voted_date,\n            'vote', v.vote\n          )\n          ORDER BY v.voted_date DESC\n        ),\n        '[]'::json\n      ) AS votes_json\n    FROM votes v\n    JOIN users u ON u.id = v.user_id\n    WHERE v.prediction_id = :prediction_id!\n  ),\n  checks AS (\n    SELECT\n      COALESCE(\n        json_agg(\n          json_build_object(\n            'id', chk.id,\n            'prediction_id', chk.prediction_id,\n            'check_date', chk.check_date,\n            'closed', chk.closed,\n            'closed_at', chk.closed_at,\n            'votes_day', chk.votes_day,\n            'votes_week', chk.votes_week,\n            'votes_month', chk.votes_month,\n            'votes_quarter', chk.votes_quarter,\n            'votes_year', chk.votes_year\n          )\n          ORDER BY chk.check_date DESC\n        ),\n        '[]'::json\n      ) AS checks_json\n    FROM (\n      SELECT\n        sc.id,\n        sc.prediction_id,\n        sc.check_date,\n        sc.closed,\n        sc.closed_at,\n        COUNT(sv.*) FILTER (WHERE sv.value = 1) AS votes_day,\n        COUNT(sv.*) FILTER (WHERE sv.value = 7) AS votes_week,\n        COUNT(sv.*) FILTER (WHERE sv.value = 30) AS votes_month,\n        COUNT(sv.*) FILTER (WHERE sv.value = 90) AS votes_quarter,\n        COUNT(sv.*) FILTER (WHERE sv.value = 365) AS votes_year\n      FROM snooze_checks sc\n      LEFT JOIN snooze_votes sv ON sv.snooze_check_id = sc.id\n      WHERE sc.prediction_id = :prediction_id!\n      GROUP BY sc.id\n    ) chk\n  )\nSELECT\n  pred.*,\n  bets.bets_json,\n  votes.votes_json,\n  checks.checks_json\nFROM pred\nCROSS JOIN bets\nCROSS JOIN votes\nCROSS JOIN checks;"};

/**
 * Query generated from SQL:
 * ```
 * (see getPredictionDetailById in predictions.sql)
 * ```
 */
export const getPredictionDetailById = new PreparedQuery<IGetPredictionDetailByIdParams,IGetPredictionDetailByIdResult>(getPredictionDetailByIdIR);


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


/** 'ClosePredictionById' parameters type */
export interface IClosePredictionByIdParams {
  closed_date: DateOrString;
  prediction_id: number;
  triggerer_id: string;
}

/** 'ClosePredictionById' return type */
export type IClosePredictionByIdResult = void;

/** 'ClosePredictionById' query type */
export interface IClosePredictionByIdQuery {
  params: IClosePredictionByIdParams;
  result: IClosePredictionByIdResult;
}

const closePredictionByIdIR: any = {"usedParamSet":{"triggerer_id":true,"closed_date":true,"prediction_id":true},"params":[{"name":"triggerer_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":40,"b":53}]},{"name":"closed_date","required":true,"transform":{"type":"scalar"},"locs":[{"a":72,"b":84}]},{"name":"prediction_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":135,"b":149}]}],"statement":"UPDATE predictions\nSET\n  triggerer_id = :triggerer_id!,\n  closed_date = :closed_date!,\n  triggered_date = NOW()\nWHERE predictions.id = :prediction_id!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE predictions
 * SET
 *   triggerer_id = :triggerer_id!,
 *   closed_date = :closed_date!,
 *   triggered_date = NOW()
 * WHERE predictions.id = :prediction_id!
 * ```
 */
export const closePredictionById = new PreparedQuery<IClosePredictionByIdParams,IClosePredictionByIdResult>(closePredictionByIdIR);


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


/** 'SetCheckDateByPredictionId' parameters type */
export interface ISetCheckDateByPredictionIdParams {
  check_date: DateOrString;
  prediction_id: number;
}

/** 'SetCheckDateByPredictionId' return type */
export type ISetCheckDateByPredictionIdResult = void;

/** 'SetCheckDateByPredictionId' query type */
export interface ISetCheckDateByPredictionIdQuery {
  params: ISetCheckDateByPredictionIdParams;
  result: ISetCheckDateByPredictionIdResult;
}

const setCheckDateByPredictionIdIR: any = {"usedParamSet":{"check_date":true,"prediction_id":true},"params":[{"name":"check_date","required":true,"transform":{"type":"scalar"},"locs":[{"a":36,"b":47}]},{"name":"prediction_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":72,"b":86}]}],"statement":"UPDATE predictions\nSET check_date = :check_date!\nWHERE predictions.id = :prediction_id!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE predictions
 * SET check_date = :check_date!
 * WHERE predictions.id = :prediction_id!
 * ```
 */
export const setCheckDateByPredictionId = new PreparedQuery<ISetCheckDateByPredictionIdParams,ISetCheckDateByPredictionIdResult>(setCheckDateByPredictionIdIR);


/** 'ExtendPredictionCheckDateBySnoozeDays' parameters type */
export interface IExtendPredictionCheckDateBySnoozeDaysParams {
  days: number;
  prediction_id: number;
}

/** 'ExtendPredictionCheckDateBySnoozeDays' return type */
export type IExtendPredictionCheckDateBySnoozeDaysResult = void;

/** 'ExtendPredictionCheckDateBySnoozeDays' query type */
export interface IExtendPredictionCheckDateBySnoozeDaysQuery {
  params: IExtendPredictionCheckDateBySnoozeDaysParams;
  result: IExtendPredictionCheckDateBySnoozeDaysResult;
}

const extendPredictionCheckDateBySnoozeDaysIR: any = {"usedParamSet":{"days":true,"prediction_id":true},"params":[{"name":"days","required":true,"transform":{"type":"scalar"},"locs":[{"a":83,"b":88}]},{"name":"prediction_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":113,"b":127}]}],"statement":"UPDATE predictions\nSET\n  check_date = predictions.check_date + '1 day'::INTERVAL * :days!\nWHERE predictions.id = :prediction_id!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE predictions
 * SET
 *   check_date = predictions.check_date + '1 day'::INTERVAL * :days!
 * WHERE predictions.id = :prediction_id!
 * ```
 */
export const extendPredictionCheckDateBySnoozeDays = new PreparedQuery<IExtendPredictionCheckDateBySnoozeDaysParams,IExtendPredictionCheckDateBySnoozeDaysResult>(extendPredictionCheckDateBySnoozeDaysIR);


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

const insertDateDrivenPredictionIR: any = {"usedParamSet":{"user_id":true,"text":true,"created_date":true,"due_date":true},"params":[{"name":"user_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":95,"b":103}]},{"name":"text","required":true,"transform":{"type":"scalar"},"locs":[{"a":108,"b":113}]},{"name":"created_date","required":true,"transform":{"type":"scalar"},"locs":[{"a":118,"b":131}]},{"name":"due_date","required":true,"transform":{"type":"scalar"},"locs":[{"a":146,"b":155}]}],"statement":"INSERT INTO predictions (\n  user_id,\n  text,\n  created_date,\n  driver,\n  due_date\n) VALUES (\n  :user_id!,\n  :text!,\n  :created_date!,\n  'date',\n  :due_date!\n) RETURNING id                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "};

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
  bets_endorsements: string | null;
  bets_invalid: string | null;
  bets_undorsements: string | null;
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
  triggered_date: Date | null;
  triggerer_discord_id: string;
  triggerer_id: string | null;
  undorse: string;
  votes_no: string | null;
  votes_yes: string | null;
}

/** 'SearchPredictions' query type */
export interface ISearchPredictionsQuery {
  params: ISearchPredictionsParams;
  result: ISearchPredictionsResult;
}

const searchPredictionsIR: any = {"usedParamSet":{"keyword":true,"statuses":true,"predictor_id":true,"non_better_id":true,"season_id":true,"include_non_applicable":true,"sort_by":true,"row_offset":true},"params":[{"name":"keyword","required":false,"transform":{"type":"scalar"},"locs":[{"a":1241,"b":1248},{"a":2318,"b":2325}]},{"name":"statuses","required":false,"transform":{"type":"scalar"},"locs":[{"a":1864,"b":1872},{"a":1917,"b":1925}]},{"name":"predictor_id","required":false,"transform":{"type":"scalar"},"locs":[{"a":1938,"b":1950},{"a":1983,"b":1995}]},{"name":"non_better_id","required":false,"transform":{"type":"scalar"},"locs":[{"a":2007,"b":2020},{"a":2128,"b":2141}]},{"name":"season_id","required":false,"transform":{"type":"scalar"},"locs":[{"a":2157,"b":2166},{"a":2210,"b":2219}]},{"name":"include_non_applicable","required":false,"transform":{"type":"scalar"},"locs":[{"a":2237,"b":2259}]},{"name":"sort_by","required":false,"transform":{"type":"scalar"},"locs":[{"a":2762,"b":2769},{"a":2854,"b":2861},{"a":2948,"b":2955},{"a":3056,"b":3063},{"a":3166,"b":3173},{"a":3254,"b":3261},{"a":3344,"b":3351},{"a":3436,"b":3443},{"a":3530,"b":3537},{"a":3626,"b":3633},{"a":3724,"b":3731},{"a":3814,"b":3821},{"a":3906,"b":3913},{"a":3996,"b":4003}]},{"name":"row_offset","required":true,"transform":{"type":"scalar"},"locs":[{"a":4138,"b":4149}]}],"statement":"WITH search_defaults AS (\n  SELECT\n    0.38::double precision AS word_sim_threshold,\n    5::integer AS keyword_prefix_min_len,\n    10::integer AS page_size\n)\nSELECT\n  p.id,\n  p.user_id AS predictor_id,\n  pred_u.discord_id AS predictor_discord_id,\n  p.text,\n  p.driver,\n  p.season_id,\n  p.season_applicable,\n  p.created_date,\n  p.due_date,\n  p.check_date,\n  p.last_check_date,\n  p.closed_date,\n  p.triggered_date,\n  p.triggerer_id,\n  trig_u.discord_id AS triggerer_discord_id,\n  p.judged_date,\n  p.retired_date,\n  p.status,\n  bet_totals.bets_endorsements,\n  bet_totals.bets_undorsements,\n  bet_totals.bets_invalid,\n  vote_totals.votes_yes,\n  vote_totals.votes_no,\n  p.endorse_ratio AS endorse,\n  p.undorse_ratio AS undorse\nFROM search_defaults sd\nCROSS JOIN predictions p\nJOIN users pred_u ON pred_u.id = p.user_id\nLEFT JOIN users trig_u ON trig_u.id = p.triggerer_id\nCROSS JOIN LATERAL (\n  SELECT\n    t.kw,\n    CASE\n      WHEN t.kw IS NULL OR char_length(t.kw) < sd.keyword_prefix_min_len OR t.kw ~ '\\s' THEN NULL\n      ELSE NULLIF(\n        regexp_replace(\n          lower(left(t.kw, char_length(t.kw) - 1)),\n          '[^a-z0-9]+',\n          '',\n          'g'\n        ),\n        ''\n      )\n    END AS prefix_stem\n  FROM (SELECT NULLIF(trim(:keyword::text), '') AS kw) AS t\n) AS k\nCROSS JOIN LATERAL (\n  SELECT\n    COUNT(b.id) FILTER (WHERE b.endorsed IS TRUE AND b.valid IS TRUE) AS bets_endorsements,\n    COUNT(b.id) FILTER (WHERE b.endorsed IS FALSE AND b.valid IS TRUE) AS bets_undorsements,\n    COUNT(b.id) FILTER (WHERE b.valid IS FALSE) AS bets_invalid\n  FROM bets b\n  WHERE b.prediction_id = p.id\n) AS bet_totals\nCROSS JOIN LATERAL (\n  SELECT\n    COUNT(v.id) FILTER (WHERE v.vote IS TRUE) AS votes_yes,\n    COUNT(v.id) FILTER (WHERE v.vote IS FALSE) AS votes_no\n  FROM votes v\n  WHERE v.prediction_id = p.id\n) AS vote_totals\nWHERE (\n  COALESCE(cardinality(:statuses::text[]), 0) = 0\n  OR p.status::text = ANY(:statuses)\n)\nAND (\n  :predictor_id::uuid IS NULL\n  OR p.user_id = :predictor_id\n)\nAND (\n  :non_better_id::uuid IS NULL\n  OR NOT EXISTS (\n    SELECT 1 FROM bets b\n    WHERE b.prediction_id = p.id AND b.user_id = :non_better_id\n  )\n)\nAND (\n  :season_id::integer IS NULL\n  OR (\n    p.season_id = :season_id\n    AND (\n      :include_non_applicable\n      OR p.season_applicable IS TRUE\n    )\n  )\n)\nAND (\n  :keyword::text IS NULL\n  OR k.kw IS NULL\n  OR p.search_vector @@ plainto_tsquery('english', k.kw)\n  OR similarity(p.text, k.kw) >= sd.word_sim_threshold\n  OR word_similarity(k.kw, p.text) >= sd.word_sim_threshold\n  OR (\n    k.prefix_stem IS NOT NULL\n    AND p.search_vector @@ to_tsquery('english', k.prefix_stem || ':*')\n  )\n)\nORDER BY\n  (CASE WHEN k.kw IS NULL THEN NULL ELSE word_similarity(k.kw, p.text) END) DESC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'created_date-asc' THEN p.created_date END ) ASC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'created_date-desc' THEN p.created_date END ) DESC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'due_date-asc' THEN COALESCE(p.due_date, p.check_date) END ) ASC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'due_date-desc' THEN COALESCE(p.due_date, p.check_date) END ) DESC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'check_date-asc' THEN p.check_date END ) ASC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'check_date-desc' THEN p.check_date END ) DESC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'retired_date-asc' THEN p.retired_date END ) ASC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'retired_date-desc' THEN p.retired_date END ) DESC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'triggered_date-asc' THEN p.triggered_date END ) ASC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'triggered_date-desc' THEN p.triggered_date END ) DESC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'closed_date-asc' THEN p.closed_date END ) ASC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'closed_date-desc' THEN p.closed_date END ) DESC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'judged_date-asc' THEN p.judged_date END ) ASC NULLS LAST,\n  ( CASE WHEN :sort_by::text = 'judged_date-desc' THEN p.judged_date END ) DESC NULLS LAST,\n  p.id ASC\nLIMIT (SELECT page_size FROM search_defaults)\nOFFSET :row_offset!"};

/**
 * Query generated from SQL:
 * ```
 * WITH search_defaults AS (
 *   SELECT
 *     0.38::double precision AS word_sim_threshold,
 *     5::integer AS keyword_prefix_min_len,
 *     10::integer AS page_size
 * )
 * SELECT
 *   p.id,
 *   p.user_id AS predictor_id,
 *   pred_u.discord_id AS predictor_discord_id,
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
 *   p.triggerer_id,
 *   trig_u.discord_id AS triggerer_discord_id,
 *   p.judged_date,
 *   p.retired_date,
 *   p.status,
 *   bet_totals.bets_endorsements,
 *   bet_totals.bets_undorsements,
 *   bet_totals.bets_invalid,
 *   vote_totals.votes_yes,
 *   vote_totals.votes_no,
 *   p.endorse_ratio AS endorse,
 *   p.undorse_ratio AS undorse
 * FROM search_defaults sd
 * CROSS JOIN predictions p
 * JOIN users pred_u ON pred_u.id = p.user_id
 * LEFT JOIN users trig_u ON trig_u.id = p.triggerer_id
 * CROSS JOIN LATERAL (
 *   SELECT
 *     t.kw,
 *     CASE
 *       WHEN t.kw IS NULL OR char_length(t.kw) < sd.keyword_prefix_min_len OR t.kw ~ '\s' THEN NULL
 *       ELSE NULLIF(
 *         regexp_replace(
 *           lower(left(t.kw, char_length(t.kw) - 1)),
 *           '[^a-z0-9]+',
 *           '',
 *           'g'
 *         ),
 *         ''
 *       )
 *     END AS prefix_stem
 *   FROM (SELECT NULLIF(trim(:keyword::text), '') AS kw) AS t
 * ) AS k
 * CROSS JOIN LATERAL (
 *   SELECT
 *     COUNT(b.id) FILTER (WHERE b.endorsed IS TRUE AND b.valid IS TRUE) AS bets_endorsements,
 *     COUNT(b.id) FILTER (WHERE b.endorsed IS FALSE AND b.valid IS TRUE) AS bets_undorsements,
 *     COUNT(b.id) FILTER (WHERE b.valid IS FALSE) AS bets_invalid
 *   FROM bets b
 *   WHERE b.prediction_id = p.id
 * ) AS bet_totals
 * CROSS JOIN LATERAL (
 *   SELECT
 *     COUNT(v.id) FILTER (WHERE v.vote IS TRUE) AS votes_yes,
 *     COUNT(v.id) FILTER (WHERE v.vote IS FALSE) AS votes_no
 *   FROM votes v
 *   WHERE v.prediction_id = p.id
 * ) AS vote_totals
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
 * AND (
 *   :keyword::text IS NULL
 *   OR k.kw IS NULL
 *   OR p.search_vector @@ plainto_tsquery('english', k.kw)
 *   OR similarity(p.text, k.kw) >= sd.word_sim_threshold
 *   OR word_similarity(k.kw, p.text) >= sd.word_sim_threshold
 *   OR (
 *     k.prefix_stem IS NOT NULL
 *     AND p.search_vector @@ to_tsquery('english', k.prefix_stem || ':*')
 *   )
 * )
 * ORDER BY
 *   (CASE WHEN k.kw IS NULL THEN NULL ELSE word_similarity(k.kw, p.text) END) DESC NULLS LAST,
 *   ( CASE WHEN :sort_by::text = 'created_date-asc' THEN p.created_date END ) ASC NULLS LAST,
 *   ( CASE WHEN :sort_by::text = 'created_date-desc' THEN p.created_date END ) DESC NULLS LAST,
 *   ( CASE WHEN :sort_by::text = 'due_date-asc' THEN COALESCE(p.due_date, p.check_date) END ) ASC NULLS LAST,
 *   ( CASE WHEN :sort_by::text = 'due_date-desc' THEN COALESCE(p.due_date, p.check_date) END ) DESC NULLS LAST,
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
 * LIMIT (SELECT page_size FROM search_defaults)
 * OFFSET :row_offset!
 * ```
 */
export const searchPredictions = new PreparedQuery<ISearchPredictionsParams,ISearchPredictionsResult>(searchPredictionsIR);


