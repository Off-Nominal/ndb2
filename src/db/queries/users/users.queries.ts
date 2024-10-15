/** Types generated for queries found in "src/db/queries/users/users.sql" */
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

const getUserByDiscordIdIR: any = {"usedParamSet":{"discord_id":true},"params":[{"name":"discord_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":52,"b":63}]}],"statement":"SELECT id, discord_id FROM users WHERE discord_id = :discord_id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT id, discord_id FROM users WHERE discord_id = :discord_id!
 * ```
 */
export const getUserByDiscordId = new PreparedQuery<IGetUserByDiscordIdParams,IGetUserByDiscordIdResult>(getUserByDiscordIdIR);


/** 'AddUser' parameters type */
export interface IAddUserParams {
  discord_id: string;
  id: string;
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

const addUserIR: any = {"usedParamSet":{"id":true,"discord_id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":43,"b":46}]},{"name":"discord_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":49,"b":60}]}],"statement":"INSERT INTO users (id, discord_id) VALUES (:id!, :discord_id!) RETURNING id, discord_id"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO users (id, discord_id) VALUES (:id!, :discord_id!) RETURNING id, discord_id
 * ```
 */
export const addUser = new PreparedQuery<IAddUserParams,IAddUserResult>(addUserIR);


