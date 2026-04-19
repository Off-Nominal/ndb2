/** Types generated for queries found in "src/data/queries/oauth_login_states/oauth_login_states.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type DateOrString = Date | string;

/** 'InsertOauthLoginState' parameters type */
export interface IInsertOauthLoginStateParams {
  code_verifier: string;
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

const insertOauthLoginStateIR: any = {"usedParamSet":{"state":true,"return_to":true,"expires_at":true,"code_verifier":true},"params":[{"name":"state","required":true,"transform":{"type":"scalar"},"locs":[{"a":85,"b":91}]},{"name":"return_to","required":true,"transform":{"type":"scalar"},"locs":[{"a":94,"b":104}]},{"name":"expires_at","required":true,"transform":{"type":"scalar"},"locs":[{"a":107,"b":118}]},{"name":"code_verifier","required":true,"transform":{"type":"scalar"},"locs":[{"a":121,"b":135}]}],"statement":"INSERT INTO oauth_login_states (state, return_to, expires_at, code_verifier)\nVALUES (:state!, :return_to!, :expires_at!, :code_verifier!)\nRETURNING state"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO oauth_login_states (state, return_to, expires_at, code_verifier)
 * VALUES (:state!, :return_to!, :expires_at!, :code_verifier!)
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
  code_verifier: string;
  return_to: string;
}

/** 'DeleteOauthLoginStateReturning' query type */
export interface IDeleteOauthLoginStateReturningQuery {
  params: IDeleteOauthLoginStateReturningParams;
  result: IDeleteOauthLoginStateReturningResult;
}

const deleteOauthLoginStateReturningIR: any = {"usedParamSet":{"state":true},"params":[{"name":"state","required":true,"transform":{"type":"scalar"},"locs":[{"a":45,"b":51}]}],"statement":"DELETE FROM oauth_login_states\nWHERE state = :state!\n  AND expires_at > now()\nRETURNING return_to, code_verifier"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM oauth_login_states
 * WHERE state = :state!
 *   AND expires_at > now()
 * RETURNING return_to, code_verifier
 * ```
 */
export const deleteOauthLoginStateReturning = new PreparedQuery<IDeleteOauthLoginStateReturningParams,IDeleteOauthLoginStateReturningResult>(deleteOauthLoginStateReturningIR);


