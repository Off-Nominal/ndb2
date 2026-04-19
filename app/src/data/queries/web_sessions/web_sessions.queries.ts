/** Types generated for queries found in "src/data/queries/web_sessions/web_sessions.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type DateOrString = Date | string;

/** 'InsertWebSession' parameters type */
export interface IInsertWebSessionParams {
  csrf_token: string;
  expires_at: DateOrString;
  last_discord_authz_at: DateOrString;
  user_id: string;
}

/** 'InsertWebSession' return type */
export interface IInsertWebSessionResult {
  csrf_token: string;
  expires_at: Date;
  id: string;
  last_discord_authz_at: Date;
  user_id: string;
}

/** 'InsertWebSession' query type */
export interface IInsertWebSessionQuery {
  params: IInsertWebSessionParams;
  result: IInsertWebSessionResult;
}

const insertWebSessionIR: any = {"usedParamSet":{"user_id":true,"csrf_token":true,"expires_at":true,"last_discord_authz_at":true},"params":[{"name":"user_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":90,"b":98}]},{"name":"csrf_token","required":true,"transform":{"type":"scalar"},"locs":[{"a":101,"b":112}]},{"name":"expires_at","required":true,"transform":{"type":"scalar"},"locs":[{"a":115,"b":126}]},{"name":"last_discord_authz_at","required":true,"transform":{"type":"scalar"},"locs":[{"a":129,"b":151}]}],"statement":"INSERT INTO web_sessions (user_id, csrf_token, expires_at, last_discord_authz_at)\nVALUES (:user_id!, :csrf_token!, :expires_at!, :last_discord_authz_at!)\nRETURNING id, user_id, csrf_token, expires_at, last_discord_authz_at"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO web_sessions (user_id, csrf_token, expires_at, last_discord_authz_at)
 * VALUES (:user_id!, :csrf_token!, :expires_at!, :last_discord_authz_at!)
 * RETURNING id, user_id, csrf_token, expires_at, last_discord_authz_at
 * ```
 */
export const insertWebSession = new PreparedQuery<IInsertWebSessionParams,IInsertWebSessionResult>(insertWebSessionIR);


/** 'GetWebSessionWithUser' parameters type */
export interface IGetWebSessionWithUserParams {
  id: string;
}

/** 'GetWebSessionWithUser' return type */
export interface IGetWebSessionWithUserResult {
  csrf_token: string;
  discord_id: string;
  id: string;
  last_discord_authz_at: Date;
  user_id: string;
}

/** 'GetWebSessionWithUser' query type */
export interface IGetWebSessionWithUserQuery {
  params: IGetWebSessionWithUserParams;
  result: IGetWebSessionWithUserResult;
}

const getWebSessionWithUserIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":152,"b":155}]}],"statement":"SELECT\n  s.id,\n  s.user_id,\n  s.csrf_token,\n  s.last_discord_authz_at,\n  u.discord_id\nFROM web_sessions s\nJOIN users u ON u.id = s.user_id\nWHERE s.id = :id!\n  AND s.revoked_at IS NULL\n  AND s.expires_at > now()"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   s.id,
 *   s.user_id,
 *   s.csrf_token,
 *   s.last_discord_authz_at,
 *   u.discord_id
 * FROM web_sessions s
 * JOIN users u ON u.id = s.user_id
 * WHERE s.id = :id!
 *   AND s.revoked_at IS NULL
 *   AND s.expires_at > now()
 * ```
 */
export const getWebSessionWithUser = new PreparedQuery<IGetWebSessionWithUserParams,IGetWebSessionWithUserResult>(getWebSessionWithUserIR);


/** 'UpdateWebSessionLastDiscordAuthzAt' parameters type */
export interface IUpdateWebSessionLastDiscordAuthzAtParams {
  id: string;
  last_discord_authz_at: DateOrString;
}

/** 'UpdateWebSessionLastDiscordAuthzAt' return type */
export interface IUpdateWebSessionLastDiscordAuthzAtResult {
  id: string;
  last_discord_authz_at: Date;
}

/** 'UpdateWebSessionLastDiscordAuthzAt' query type */
export interface IUpdateWebSessionLastDiscordAuthzAtQuery {
  params: IUpdateWebSessionLastDiscordAuthzAtParams;
  result: IUpdateWebSessionLastDiscordAuthzAtResult;
}

const updateWebSessionLastDiscordAuthzAtIR: any = {"usedParamSet":{"last_discord_authz_at":true,"id":true},"params":[{"name":"last_discord_authz_at","required":true,"transform":{"type":"scalar"},"locs":[{"a":48,"b":70}]},{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":83,"b":86}]}],"statement":"UPDATE web_sessions\nSET last_discord_authz_at = :last_discord_authz_at!\nWHERE id = :id!\n  AND revoked_at IS NULL\n  AND expires_at > now()\nRETURNING id, last_discord_authz_at"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE web_sessions
 * SET last_discord_authz_at = :last_discord_authz_at!
 * WHERE id = :id!
 *   AND revoked_at IS NULL
 *   AND expires_at > now()
 * RETURNING id, last_discord_authz_at
 * ```
 */
export const updateWebSessionLastDiscordAuthzAt = new PreparedQuery<IUpdateWebSessionLastDiscordAuthzAtParams,IUpdateWebSessionLastDiscordAuthzAtResult>(updateWebSessionLastDiscordAuthzAtIR);


/** 'RevokeWebSession' parameters type */
export interface IRevokeWebSessionParams {
  id: string;
}

/** 'RevokeWebSession' return type */
export interface IRevokeWebSessionResult {
  id: string;
}

/** 'RevokeWebSession' query type */
export interface IRevokeWebSessionQuery {
  params: IRevokeWebSessionParams;
  result: IRevokeWebSessionResult;
}

const revokeWebSessionIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":54,"b":57}]}],"statement":"UPDATE web_sessions\nSET revoked_at = now()\nWHERE id = :id!\n  AND revoked_at IS NULL\nRETURNING id"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE web_sessions
 * SET revoked_at = now()
 * WHERE id = :id!
 *   AND revoked_at IS NULL
 * RETURNING id
 * ```
 */
export const revokeWebSession = new PreparedQuery<IRevokeWebSessionParams,IRevokeWebSessionResult>(revokeWebSessionIR);


