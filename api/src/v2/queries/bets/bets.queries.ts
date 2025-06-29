/** Types generated for queries found in "src/v2/queries/bets/bets.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

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


