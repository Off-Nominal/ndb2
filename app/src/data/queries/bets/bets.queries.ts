/** Types generated for queries found in "src/data/queries/bets/bets.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type DateOrString = Date | string;

export type numberArray = (number)[];

/** 'GetBetsByPredictionId' parameters type */
export interface IGetBetsByPredictionIdParams {
  prediction_id: number;
}

/** 'GetBetsByPredictionId' return type */
export interface IGetBetsByPredictionIdResult {
  better_discord_id: string;
  better_id: string;
  date: Date;
  endorsed: boolean;
  id: number;
  payout: number | null;
  prediction_id: number;
  season_payout: number | null;
  valid: boolean;
  wager: number;
}

/** 'GetBetsByPredictionId' query type */
export interface IGetBetsByPredictionIdQuery {
  params: IGetBetsByPredictionIdParams;
  result: IGetBetsByPredictionIdResult;
}

const getBetsByPredictionIdIR: any = {"usedParamSet":{"prediction_id":true},"params":[{"name":"prediction_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":269,"b":283}]}],"statement":"SELECT \n    b.id,\n    b.prediction_id,\n    b.user_id as better_id,\n    u.discord_id as better_discord_id,\n    b.date,\n    b.endorsed,\n    b.wager,\n    b.valid,\n    b.payout,\n    b.season_payout\n  FROM bets b\n  JOIN users u ON u.id = b.user_id\n  WHERE b.prediction_id = :prediction_id!\n  ORDER BY date ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT 
 *     b.id,
 *     b.prediction_id,
 *     b.user_id as better_id,
 *     u.discord_id as better_discord_id,
 *     b.date,
 *     b.endorsed,
 *     b.wager,
 *     b.valid,
 *     b.payout,
 *     b.season_payout
 *   FROM bets b
 *   JOIN users u ON u.id = b.user_id
 *   WHERE b.prediction_id = :prediction_id!
 *   ORDER BY date ASC
 * ```
 */
export const getBetsByPredictionId = new PreparedQuery<IGetBetsByPredictionIdParams,IGetBetsByPredictionIdResult>(getBetsByPredictionIdIR);


/** 'GetBetsByUserId' parameters type */
export interface IGetBetsByUserIdParams {
  prediction_ids: numberArray;
  user_id: string;
}

/** 'GetBetsByUserId' return type */
export interface IGetBetsByUserIdResult {
  date: Date;
  endorsed: boolean;
  prediction_id: number;
  valid: boolean;
}

/** 'GetBetsByUserId' query type */
export interface IGetBetsByUserIdQuery {
  params: IGetBetsByUserIdParams;
  result: IGetBetsByUserIdResult;
}

const getBetsByUserIdIR: any = {"usedParamSet":{"user_id":true,"prediction_ids":true},"params":[{"name":"user_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":102,"b":110}]},{"name":"prediction_ids","required":true,"transform":{"type":"scalar"},"locs":[{"a":140,"b":155}]}],"statement":"SELECT\n    b.prediction_id,\n    b.endorsed,\n    b.date,\n    b.valid\n  FROM bets b\n  WHERE b.user_id = :user_id!\n  AND b.prediction_id = ANY(:prediction_ids!::int[])\n  ORDER BY b.prediction_id ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *     b.prediction_id,
 *     b.endorsed,
 *     b.date,
 *     b.valid
 *   FROM bets b
 *   WHERE b.user_id = :user_id!
 *   AND b.prediction_id = ANY(:prediction_ids!::int[])
 *   ORDER BY b.prediction_id ASC
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


