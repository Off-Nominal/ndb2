/** Types generated for queries found in "src/v2/queries/snooze_votes/snooze_votes.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type DateOrString = Date | string;

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** 'InsertSnoozeVote' parameters type */
export interface IInsertSnoozeVoteParams {
  created_at: DateOrString;
  snooze_check_id: number;
  user_id: string;
  value: number;
}

/** 'InsertSnoozeVote' return type */
export interface IInsertSnoozeVoteResult {
  created_at: Date;
  snooze_check_id: number;
  user_id: string;
  value: number;
}

/** 'InsertSnoozeVote' query type */
export interface IInsertSnoozeVoteQuery {
  params: IInsertSnoozeVoteParams;
  result: IInsertSnoozeVoteResult;
}

const insertSnoozeVoteIR: any = {"usedParamSet":{"snooze_check_id":true,"user_id":true,"value":true,"created_at":true},"params":[{"name":"snooze_check_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":92,"b":108}]},{"name":"user_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":113,"b":121}]},{"name":"value","required":true,"transform":{"type":"scalar"},"locs":[{"a":126,"b":132},{"a":215,"b":221}]},{"name":"created_at","required":true,"transform":{"type":"scalar"},"locs":[{"a":137,"b":148},{"a":237,"b":248}]}],"statement":"INSERT INTO snooze_votes (\n  snooze_check_id,\n  user_id,\n  value,\n  created_at\n) VALUES (\n  :snooze_check_id!,\n  :user_id!,\n  :value!,\n  :created_at!\n)\nON CONFLICT (snooze_check_id, user_id)\n  DO UPDATE SET value = :value!, created_at = :created_at!\nRETURNING snooze_check_id, user_id, value, created_at"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO snooze_votes (
 *   snooze_check_id,
 *   user_id,
 *   value,
 *   created_at
 * ) VALUES (
 *   :snooze_check_id!,
 *   :user_id!,
 *   :value!,
 *   :created_at!
 * )
 * ON CONFLICT (snooze_check_id, user_id)
 *   DO UPDATE SET value = :value!, created_at = :created_at!
 * RETURNING snooze_check_id, user_id, value, created_at
 * ```
 */
export const insertSnoozeVote = new PreparedQuery<IInsertSnoozeVoteParams,IInsertSnoozeVoteResult>(insertSnoozeVoteIR);


/** 'GetSnoozeCheckVoteTallies' parameters type */
export interface IGetSnoozeCheckVoteTalliesParams {
  snooze_check_id: number;
}

/** 'GetSnoozeCheckVoteTallies' return type */
export interface IGetSnoozeCheckVoteTalliesResult {
  check_date: Date;
  closed: boolean;
  closed_at: Date | null;
  id: number;
  prediction_id: number | null;
  values: Json | null;
}

/** 'GetSnoozeCheckVoteTallies' query type */
export interface IGetSnoozeCheckVoteTalliesQuery {
  params: IGetSnoozeCheckVoteTalliesParams;
  result: IGetSnoozeCheckVoteTalliesResult;
}

const getSnoozeCheckVoteTalliesIR: any = {"usedParamSet":{"snooze_check_id":true},"params":[{"name":"snooze_check_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":552,"b":568}]}],"statement":"SELECT\n  sc.id,\n  sc.prediction_id,\n  sc.check_date,\n  sc.closed,\n  sc.closed_at,\n  (SELECT row_to_json(vals)\n    FROM (\n      SELECT\n        COUNT(sv.*) FILTER (WHERE sv.value = 1) AS day,\n        COUNT(sv.*) FILTER (WHERE sv.value = 7) AS week,\n        COUNT(sv.*) FILTER (WHERE sv.value = 30) AS month,\n        COUNT(sv.*) FILTER (WHERE sv.value = 90) AS quarter,\n        COUNT(sv.*) FILTER (WHERE sv.value = 365) AS year\n      FROM snooze_votes sv\n      WHERE sv.snooze_check_id = sc.id\n    ) vals\n  ) AS values\nFROM snooze_checks sc\nWHERE sc.id = :snooze_check_id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   sc.id,
 *   sc.prediction_id,
 *   sc.check_date,
 *   sc.closed,
 *   sc.closed_at,
 *   (SELECT row_to_json(vals)
 *     FROM (
 *       SELECT
 *         COUNT(sv.*) FILTER (WHERE sv.value = 1) AS day,
 *         COUNT(sv.*) FILTER (WHERE sv.value = 7) AS week,
 *         COUNT(sv.*) FILTER (WHERE sv.value = 30) AS month,
 *         COUNT(sv.*) FILTER (WHERE sv.value = 90) AS quarter,
 *         COUNT(sv.*) FILTER (WHERE sv.value = 365) AS year
 *       FROM snooze_votes sv
 *       WHERE sv.snooze_check_id = sc.id
 *     ) vals
 *   ) AS values
 * FROM snooze_checks sc
 * WHERE sc.id = :snooze_check_id!
 * ```
 */
export const getSnoozeCheckVoteTallies = new PreparedQuery<IGetSnoozeCheckVoteTalliesParams,IGetSnoozeCheckVoteTalliesResult>(getSnoozeCheckVoteTalliesIR);


