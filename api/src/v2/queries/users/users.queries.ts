/** Types generated for queries found in "src/v2/queries/users/users.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetUserByDiscordId' parameters type */
export interface IGetUserByDiscordIdParams {
  discord_id: string;
}

/** 'GetUserByDiscordId' return type */
export interface IGetUserByDiscordIdResult {
  discord_id: string;
  id: string;
}

/** 'GetUserByDiscordId' query type */
export interface IGetUserByDiscordIdQuery {
  params: IGetUserByDiscordIdParams;
  result: IGetUserByDiscordIdResult;
}

const getUserByDiscordIdIR: any = {"usedParamSet":{"discord_id":true},"params":[{"name":"discord_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":57,"b":68}]}],"statement":"SELECT id, discord_id \n  FROM users\n  WHERE discord_id = :discord_id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT id, discord_id 
 *   FROM users
 *   WHERE discord_id = :discord_id!
 * ```
 */
export const getUserByDiscordId = new PreparedQuery<IGetUserByDiscordIdParams,IGetUserByDiscordIdResult>(getUserByDiscordIdIR);


/** 'AddUser' parameters type */
export interface IAddUserParams {
  discord_id: string;
}

/** 'AddUser' return type */
export interface IAddUserResult {
  discord_id: string;
  id: string;
}

/** 'AddUser' query type */
export interface IAddUserQuery {
  params: IAddUserParams;
  result: IAddUserResult;
}

const addUserIR: any = {"usedParamSet":{"discord_id":true},"params":[{"name":"discord_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":42,"b":53}]}],"statement":"INSERT INTO users (discord_id) \n  VALUES (:discord_id!) \n  RETURNING id, discord_id"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO users (discord_id) 
 *   VALUES (:discord_id!) 
 *   RETURNING id, discord_id
 * ```
 */
export const addUser = new PreparedQuery<IAddUserParams,IAddUserResult>(addUserIR);


