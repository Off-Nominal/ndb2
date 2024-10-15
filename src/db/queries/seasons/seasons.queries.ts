/** Types generated for queries found in "src/db/queries/seasons/seasons.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** 'GetCurrentSeason' parameters type */
export type IGetCurrentSeasonParams = void;

/** 'GetCurrentSeason' return type */
export interface IGetCurrentSeasonResult {
  closed: number;
  end: Date;
  id: number;
  name: string;
  start: Date;
}

/** 'GetCurrentSeason' query type */
export interface IGetCurrentSeasonQuery {
  params: IGetCurrentSeasonParams;
  result: IGetCurrentSeasonResult;
}

const getCurrentSeasonIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT \n  id,\n  name,\n  start,\n  \"end\",\n  wager_cap\n  closed\nFROM seasons WHERE start < NOW() AND \"end\" >= NOW()"};

/**
 * Query generated from SQL:
 * ```
 * SELECT 
 *   id,
 *   name,
 *   start,
 *   "end",
 *   wager_cap
 *   closed
 * FROM seasons WHERE start < NOW() AND "end" >= NOW()
 * ```
 */
export const getCurrentSeason = new PreparedQuery<IGetCurrentSeasonParams,IGetCurrentSeasonResult>(getCurrentSeasonIR);


/** 'GetLastSeason' parameters type */
export type IGetLastSeasonParams = void;

/** 'GetLastSeason' return type */
export interface IGetLastSeasonResult {
  closed: number;
  end: Date;
  id: number;
  name: string;
  start: Date;
}

/** 'GetLastSeason' query type */
export interface IGetLastSeasonQuery {
  params: IGetLastSeasonParams;
  result: IGetLastSeasonResult;
}

const getLastSeasonIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT \n  id,\n  name,\n  start,\n  \"end\",\n  wager_cap\n  closed\nFROM seasons WHERE \"end\" < NOW() ORDER BY \"end\" DESC LIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT 
 *   id,
 *   name,
 *   start,
 *   "end",
 *   wager_cap
 *   closed
 * FROM seasons WHERE "end" < NOW() ORDER BY "end" DESC LIMIT 1
 * ```
 */
export const getLastSeason = new PreparedQuery<IGetLastSeasonParams,IGetLastSeasonResult>(getLastSeasonIR);


/** 'GetAllSeasons' parameters type */
export type IGetAllSeasonsParams = void;

/** 'GetAllSeasons' return type */
export interface IGetAllSeasonsResult {
  closed: boolean;
  end: Date;
  id: number;
  identifier: string | null;
  name: string;
  start: Date;
  wager_cap: number;
}

/** 'GetAllSeasons' query type */
export interface IGetAllSeasonsQuery {
  params: IGetAllSeasonsParams;
  result: IGetAllSeasonsResult;
}

const getAllSeasonsIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT\n  id,\n  name,\n  start,\n  \"end\",\n  wager_cap,\n  closed,\n  (SELECT CASE\n      WHEN start < NOW() AND \"end\" >= NOW() THEN 'current'\n      WHEN \"end\" < NOW() THEN 'past'\n      ELSE 'future' \n    END\n  ) as identifier\nFROM seasons\nORDER BY \"end\" DESC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   id,
 *   name,
 *   start,
 *   "end",
 *   wager_cap,
 *   closed,
 *   (SELECT CASE
 *       WHEN start < NOW() AND "end" >= NOW() THEN 'current'
 *       WHEN "end" < NOW() THEN 'past'
 *       ELSE 'future' 
 *     END
 *   ) as identifier
 * FROM seasons
 * ORDER BY "end" DESC
 * ```
 */
export const getAllSeasons = new PreparedQuery<IGetAllSeasonsParams,IGetAllSeasonsResult>(getAllSeasonsIR);


/** 'CloseSeasonById' parameters type */
export type ICloseSeasonByIdParams = void;

/** 'CloseSeasonById' return type */
export interface ICloseSeasonByIdResult {
  id: number;
}

/** 'CloseSeasonById' query type */
export interface ICloseSeasonByIdQuery {
  params: ICloseSeasonByIdParams;
  result: ICloseSeasonByIdResult;
}

const closeSeasonByIdIR: any = {"usedParamSet":{},"params":[],"statement":"UPDATE seasons\nSET closed = TRUE\nWHERE id = $1\nRETURNING id"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE seasons
 * SET closed = TRUE
 * WHERE id = $1
 * RETURNING id
 * ```
 */
export const closeSeasonById = new PreparedQuery<ICloseSeasonByIdParams,ICloseSeasonByIdResult>(closeSeasonByIdIR);


/** 'GetSeasonResultsById' parameters type */
export type IGetSeasonResultsByIdParams = void;

/** 'GetSeasonResultsById' return type */
export interface IGetSeasonResultsByIdResult {
  bets: Json | null;
  largest_payout: Json | null;
  largest_penalty: Json | null;
  predictions: Json | null;
  scores: Json | null;
  season: Json | null;
}

/** 'GetSeasonResultsById' query type */
export interface IGetSeasonResultsByIdQuery {
  params: IGetSeasonResultsByIdParams;
  result: IGetSeasonResultsByIdResult;
}

const getSeasonResultsByIdIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT\n  (SELECT row_to_json(s) FROM (\n    SELECT \n      id,\n      name,\n      start,\n      \"end\",\n      wager_cap,\n      closed\n    FROM seasons WHERE id = $1\n  ) s ) as season,\n  (SELECT row_to_json(p) FROM (\n    SELECT\n      COUNT(*) FILTER (WHERE closed_date IS NOT NULL) as closed,\n      COUNT(*) FILTER (WHERE status = 'successful') as successes,\n      COUNT(*) FILTER (WHERE status = 'failed') as failures\n    FROM predictions\n    WHERE season_id = $1\n  ) p ) as predictions,\n  (SELECT row_to_json(b) FROM (\n    SELECT\n      COUNT(bets.*) FILTER (WHERE predictions.closed_date IS NOT NULL) as closed,\n      COUNT(bets.*) FILTER (WHERE bets.season_payout IS NOT NULL AND bets.season_payout > 0) as successes,\n      COUNT(bets.*) FILTER (WHERE bets.season_payout IS NOT NULL AND bets.season_payout < 0) as failures\n    FROM bets\n    JOIN predictions ON predictions.id = bets.prediction_id\n    WHERE predictions.season_id = $1 AND bets.valid IS TRUE\n  ) b ) as bets,\n  (SELECT row_to_json(s) FROM (\n    SELECT\n      SUM(bets.season_payout) FILTER (WHERE bets.season_payout IS NOT NULL AND bets.season_payout > 0) as payouts,\n      SUM(bets.season_payout) FILTER (WHERE bets.season_payout IS NOT NULL AND bets.season_payout < 0) as penalties\n    FROM bets\n    JOIN predictions ON predictions.id = bets.prediction_id\n    WHERE predictions.season_id = $1 AND bets.valid IS TRUE\n  ) s ) as scores,\n  (SELECT row_to_json(lpay) FROM (\n    SELECT\n      bets.season_payout as value,\n      predictions.id as prediction_id,\n      (SELECT row_to_json(better) FROM (\n        SELECT\n          id,\n          discord_id\n        FROM users\n        WHERE users.id = bets.user_id\n      ) better ) as better\n    FROM bets\n    JOIN predictions ON predictions.id = bets.prediction_id\n    WHERE predictions.season_id = $1 AND bets.valid IS TRUE AND bets.season_payout IS NOT NULL\n    ORDER BY bets.season_payout DESC\n    LIMIT 1\n  ) lpay ) as largest_payout,\n  (SELECT row_to_json(lpen) FROM (\n    SELECT\n      bets.season_payout as value,\n      predictions.id as prediction_id,\n      (SELECT row_to_json(better) FROM (\n        SELECT\n          id,\n          discord_id\n        FROM users\n        WHERE users.id = bets.user_id\n      ) better ) as better\n    FROM bets\n    JOIN predictions ON predictions.id = bets.prediction_id\n    WHERE predictions.season_id = $1 AND bets.valid IS TRUE AND bets.season_payout IS NOT NULL\n    ORDER BY bets.season_payout ASC\n    LIMIT 1\n  ) lpen ) as largest_penalty"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   (SELECT row_to_json(s) FROM (
 *     SELECT 
 *       id,
 *       name,
 *       start,
 *       "end",
 *       wager_cap,
 *       closed
 *     FROM seasons WHERE id = $1
 *   ) s ) as season,
 *   (SELECT row_to_json(p) FROM (
 *     SELECT
 *       COUNT(*) FILTER (WHERE closed_date IS NOT NULL) as closed,
 *       COUNT(*) FILTER (WHERE status = 'successful') as successes,
 *       COUNT(*) FILTER (WHERE status = 'failed') as failures
 *     FROM predictions
 *     WHERE season_id = $1
 *   ) p ) as predictions,
 *   (SELECT row_to_json(b) FROM (
 *     SELECT
 *       COUNT(bets.*) FILTER (WHERE predictions.closed_date IS NOT NULL) as closed,
 *       COUNT(bets.*) FILTER (WHERE bets.season_payout IS NOT NULL AND bets.season_payout > 0) as successes,
 *       COUNT(bets.*) FILTER (WHERE bets.season_payout IS NOT NULL AND bets.season_payout < 0) as failures
 *     FROM bets
 *     JOIN predictions ON predictions.id = bets.prediction_id
 *     WHERE predictions.season_id = $1 AND bets.valid IS TRUE
 *   ) b ) as bets,
 *   (SELECT row_to_json(s) FROM (
 *     SELECT
 *       SUM(bets.season_payout) FILTER (WHERE bets.season_payout IS NOT NULL AND bets.season_payout > 0) as payouts,
 *       SUM(bets.season_payout) FILTER (WHERE bets.season_payout IS NOT NULL AND bets.season_payout < 0) as penalties
 *     FROM bets
 *     JOIN predictions ON predictions.id = bets.prediction_id
 *     WHERE predictions.season_id = $1 AND bets.valid IS TRUE
 *   ) s ) as scores,
 *   (SELECT row_to_json(lpay) FROM (
 *     SELECT
 *       bets.season_payout as value,
 *       predictions.id as prediction_id,
 *       (SELECT row_to_json(better) FROM (
 *         SELECT
 *           id,
 *           discord_id
 *         FROM users
 *         WHERE users.id = bets.user_id
 *       ) better ) as better
 *     FROM bets
 *     JOIN predictions ON predictions.id = bets.prediction_id
 *     WHERE predictions.season_id = $1 AND bets.valid IS TRUE AND bets.season_payout IS NOT NULL
 *     ORDER BY bets.season_payout DESC
 *     LIMIT 1
 *   ) lpay ) as largest_payout,
 *   (SELECT row_to_json(lpen) FROM (
 *     SELECT
 *       bets.season_payout as value,
 *       predictions.id as prediction_id,
 *       (SELECT row_to_json(better) FROM (
 *         SELECT
 *           id,
 *           discord_id
 *         FROM users
 *         WHERE users.id = bets.user_id
 *       ) better ) as better
 *     FROM bets
 *     JOIN predictions ON predictions.id = bets.prediction_id
 *     WHERE predictions.season_id = $1 AND bets.valid IS TRUE AND bets.season_payout IS NOT NULL
 *     ORDER BY bets.season_payout ASC
 *     LIMIT 1
 *   ) lpen ) as largest_penalty
 * ```
 */
export const getSeasonResultsById = new PreparedQuery<IGetSeasonResultsByIdParams,IGetSeasonResultsByIdResult>(getSeasonResultsByIdIR);


