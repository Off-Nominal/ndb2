/** Types generated for queries found in "src/db/queries/bets/bets.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type DateOrString = Date | string;

/** 'GetBetsByUserId' parameters type */
export interface IGetBetsByUserIdParams {
  user_id: string;
}

/** 'GetBetsByUserId' return type */
export interface IGetBetsByUserIdResult {
  date: Date;
  endorsed: boolean;
  id: number;
  payout: number | null;
  prediction_id: number;
  season_payout: number | null;
  valid: boolean;
  wager: number | null;
}

/** 'GetBetsByUserId' query type */
export interface IGetBetsByUserIdQuery {
  params: IGetBetsByUserIdParams;
  result: IGetBetsByUserIdResult;
}

const getBetsByUserIdIR: any = {"usedParamSet":{"user_id":true},"params":[{"name":"user_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":144,"b":152}]}],"statement":"SELECT\n    id,\n    prediction_id,\n    date,\n    endorsed,\n    wager,\n    valid,\n    payout,\n    season_payout\n  FROM bets b\n  WHERE b.user_id = :user_id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *     id,
 *     prediction_id,
 *     date,
 *     endorsed,
 *     wager,
 *     valid,
 *     payout,
 *     season_payout
 *   FROM bets b
 *   WHERE b.user_id = :user_id!
 * ```
 */
export const getBetsByUserId = new PreparedQuery<IGetBetsByUserIdParams,IGetBetsByUserIdResult>(getBetsByUserIdIR);


/** 'AddBet' parameters type */
export interface IAddBetParams {
  date: DateOrString;
  endorsed: boolean;
  prediction_id: number;
  user_id: string;
}

/** 'AddBet' return type */
export interface IAddBetResult {
  date: Date;
  endorsed: boolean;
  id: number;
  payout: number | null;
  prediction_id: number;
  user_id: string;
  valid: boolean;
}

/** 'AddBet' query type */
export interface IAddBetQuery {
  params: IAddBetParams;
  result: IAddBetResult;
}

const addBetIR: any = {"usedParamSet":{"user_id":true,"prediction_id":true,"endorsed":true,"date":true},"params":[{"name":"user_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":91,"b":99}]},{"name":"prediction_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":106,"b":120}]},{"name":"endorsed","required":true,"transform":{"type":"scalar"},"locs":[{"a":127,"b":136},{"a":222,"b":231}]},{"name":"date","required":true,"transform":{"type":"scalar"},"locs":[{"a":143,"b":148}]}],"statement":"INSERT INTO bets (\n    user_id,\n    prediction_id,\n    endorsed,\n    date\n  ) VALUES (\n    :user_id!,\n    :prediction_id!,\n    :endorsed!,\n    :date!\n  ) \n  ON CONFLICT (user_id, prediction_id) \n  DO UPDATE SET endorsed = :endorsed!\n  RETURNING id, user_id, prediction_id, date, endorsed, valid, payout"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO bets (
 *     user_id,
 *     prediction_id,
 *     endorsed,
 *     date
 *   ) VALUES (
 *     :user_id!,
 *     :prediction_id!,
 *     :endorsed!,
 *     :date!
 *   ) 
 *   ON CONFLICT (user_id, prediction_id) 
 *   DO UPDATE SET endorsed = :endorsed!
 *   RETURNING id, user_id, prediction_id, date, endorsed, valid, payout
 * ```
 */
export const addBet = new PreparedQuery<IAddBetParams,IAddBetResult>(addBetIR);


