/** Types generated for queries found in "src/v2/queries/votes/votes.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetVotesByPredictionId' parameters type */
export interface IGetVotesByPredictionIdParams {
  prediction_id: number;
}

/** 'GetVotesByPredictionId' return type */
export interface IGetVotesByPredictionIdResult {
  id: number;
  prediction_id: number;
  vote: boolean;
  voted_date: Date;
  voter_discord_id: string;
  voter_id: string;
}

/** 'GetVotesByPredictionId' query type */
export interface IGetVotesByPredictionIdQuery {
  params: IGetVotesByPredictionIdParams;
  result: IGetVotesByPredictionIdResult;
}

const getVotesByPredictionIdIR: any = {"usedParamSet":{"prediction_id":true},"params":[{"name":"prediction_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":183,"b":197}]}],"statement":"SELECT \n  v.id,\n  v.prediction_id, \n  u.id as voter_id,\n  u.discord_id as voter_discord_id,\n  voted_date,\n  vote\nFROM votes v\nJOIN users u ON u.id = v.user_id\nWHERE v.prediction_id = :prediction_id!\nORDER BY voted_date DESC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT 
 *   v.id,
 *   v.prediction_id, 
 *   u.id as voter_id,
 *   u.discord_id as voter_discord_id,
 *   voted_date,
 *   vote
 * FROM votes v
 * JOIN users u ON u.id = v.user_id
 * WHERE v.prediction_id = :prediction_id!
 * ORDER BY voted_date DESC
 * ```
 */
export const getVotesByPredictionId = new PreparedQuery<IGetVotesByPredictionIdParams,IGetVotesByPredictionIdResult>(getVotesByPredictionIdIR);


