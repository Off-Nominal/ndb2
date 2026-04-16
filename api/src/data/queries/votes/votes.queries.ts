/** Types generated for queries found in "src/data/queries/votes/votes.sql" */
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


/** 'AddVote' parameters type */
export interface IAddVoteParams {
  prediction_id: number;
  user_id: string;
  vote: boolean;
}

/** 'AddVote' return type */
export interface IAddVoteResult {
  id: number;
  prediction_id: number;
  user_id: string;
  vote: boolean;
  voted_date: Date;
}

/** 'AddVote' query type */
export interface IAddVoteQuery {
  params: IAddVoteParams;
  result: IAddVoteResult;
}

const addVoteIR: any = {"usedParamSet":{"user_id":true,"prediction_id":true,"vote":true},"params":[{"name":"user_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":82,"b":90}]},{"name":"prediction_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":95,"b":109}]},{"name":"vote","required":true,"transform":{"type":"scalar"},"locs":[{"a":114,"b":119},{"a":192,"b":197}]}],"statement":"INSERT INTO votes (\n  user_id,\n  prediction_id,\n  vote,\n  voted_date\n) VALUES (\n  :user_id!,\n  :prediction_id!,\n  :vote!,\n  NOW()\n)\nON CONFLICT (user_id, prediction_id)\n  DO UPDATE SET vote = :vote!\nRETURNING id, user_id, prediction_id, vote, voted_date"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO votes (
 *   user_id,
 *   prediction_id,
 *   vote,
 *   voted_date
 * ) VALUES (
 *   :user_id!,
 *   :prediction_id!,
 *   :vote!,
 *   NOW()
 * )
 * ON CONFLICT (user_id, prediction_id)
 *   DO UPDATE SET vote = :vote!
 * RETURNING id, user_id, prediction_id, vote, voted_date
 * ```
 */
export const addVote = new PreparedQuery<IAddVoteParams,IAddVoteResult>(addVoteIR);


