/** Types generated for queries found in "src/db/queries/votes/votes.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

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


/** 'DeleteAllVotesByPredictionId' parameters type */
export interface IDeleteAllVotesByPredictionIdParams {
  prediction_id: number;
}

/** 'DeleteAllVotesByPredictionId' return type */
export type IDeleteAllVotesByPredictionIdResult = void;

/** 'DeleteAllVotesByPredictionId' query type */
export interface IDeleteAllVotesByPredictionIdQuery {
  params: IDeleteAllVotesByPredictionIdParams;
  result: IDeleteAllVotesByPredictionIdResult;
}

const deleteAllVotesByPredictionIdIR: any = {"usedParamSet":{"prediction_id":true},"params":[{"name":"prediction_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":40,"b":54}]}],"statement":"DELETE FROM votes WHERE prediction_id = :prediction_id!"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM votes WHERE prediction_id = :prediction_id!
 * ```
 */
export const deleteAllVotesByPredictionId = new PreparedQuery<IDeleteAllVotesByPredictionIdParams,IDeleteAllVotesByPredictionIdResult>(deleteAllVotesByPredictionIdIR);


