/** Types generated for queries found in "src/data/queries/oauth_login_states/oauth_login_states.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type DateOrString = Date | string;

/** 'InsertOauthLoginState' parameters type */
export interface IInsertOauthLoginStateParams {
  expires_at: DateOrString;
  return_to: string;
  state: string;
}

/** 'InsertOauthLoginState' return type */
export interface IInsertOauthLoginStateResult {
  state: string;
}

/** 'InsertOauthLoginState' query type */
export interface IInsertOauthLoginStateQuery {
  params: IInsertOauthLoginStateParams;
  result: IInsertOauthLoginStateResult;
}

const insertOauthLoginStateIR: any = {"usedParamSet":{"state":true,"return_to":true,"expires_at":true},"params":[{"name":"state","required":true,"transform":{"type":"scalar"},"locs":[{"a":70,"b":76}]},{"name":"return_to","required":true,"transform":{"type":"scalar"},"locs":[{"a":79,"b":89}]},{"name":"expires_at","required":true,"transform":{"type":"scalar"},"locs":[{"a":92,"b":103}]}],"statement":"INSERT INTO oauth_login_states (state, return_to, expires_at)\nVALUES (:state!, :return_to!, :expires_at!)\nRETURNING state"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO oauth_login_states (state, return_to, expires_at)
 * VALUES (:state!, :return_to!, :expires_at!)
 * RETURNING state
 * ```
 */
export const insertOauthLoginState = new PreparedQuery<IInsertOauthLoginStateParams,IInsertOauthLoginStateResult>(insertOauthLoginStateIR);


/** 'DeleteOauthLoginStateReturning' parameters type */
export interface IDeleteOauthLoginStateReturningParams {
  state: string;
}

/** 'DeleteOauthLoginStateReturning' return type */
export interface IDeleteOauthLoginStateReturningResult {
  return_to: string;
}

/** 'DeleteOauthLoginStateReturning' query type */
export interface IDeleteOauthLoginStateReturningQuery {
  params: IDeleteOauthLoginStateReturningParams;
  result: IDeleteOauthLoginStateReturningResult;
}

const deleteOauthLoginStateReturningIR: any = {"usedParamSet":{"state":true},"params":[{"name":"state","required":true,"transform":{"type":"scalar"},"locs":[{"a":45,"b":51}]}],"statement":"DELETE FROM oauth_login_states\nWHERE state = :state!\n  AND expires_at > now()\nRETURNING return_to"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM oauth_login_states
 * WHERE state = :state!
 *   AND expires_at > now()
 * RETURNING return_to
 * ```
 */
export const deleteOauthLoginStateReturning = new PreparedQuery<IDeleteOauthLoginStateReturningParams,IDeleteOauthLoginStateReturningResult>(deleteOauthLoginStateReturningIR);


