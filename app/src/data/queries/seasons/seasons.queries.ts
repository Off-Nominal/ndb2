/** Types generated for queries found in "src/data/queries/seasons/seasons.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetAllSeasons' parameters type */
export type IGetAllSeasonsParams = void;

/** 'GetAllSeasons' return type */
export interface IGetAllSeasonsResult {
  closed: boolean;
  end: Date;
  id: number;
  name: string;
  start: Date;
  wager_cap: number;
}

/** 'GetAllSeasons' query type */
export interface IGetAllSeasonsQuery {
  params: IGetAllSeasonsParams;
  result: IGetAllSeasonsResult;
}

const getAllSeasonsIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT\n  id,\n  name,\n  start,\n  \"end\",\n  wager_cap,\n  closed\nFROM seasons\nORDER BY \"end\" DESC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   id,
 *   name,
 *   start,
 *   "end",
 *   wager_cap,
 *   closed
 * FROM seasons
 * ORDER BY "end" DESC
 * ```
 */
export const getAllSeasons = new PreparedQuery<IGetAllSeasonsParams,IGetAllSeasonsResult>(getAllSeasonsIR);


/** 'GetSeasonById' parameters type */
export interface IGetSeasonByIdParams {
  id: number;
}

/** 'GetSeasonById' return type */
export interface IGetSeasonByIdResult {
  closed: boolean;
  end: Date;
  id: number;
  name: string;
  start: Date;
  wager_cap: number;
}

/** 'GetSeasonById' query type */
export interface IGetSeasonByIdQuery {
  params: IGetSeasonByIdParams;
  result: IGetSeasonByIdResult;
}

const getSeasonByIdIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":85,"b":88}]}],"statement":"SELECT\n  id,\n  name,\n  start,\n  \"end\",\n  wager_cap,\n  closed\nFROM seasons\nWHERE id = :id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   id,
 *   name,
 *   start,
 *   "end",
 *   wager_cap,
 *   closed
 * FROM seasons
 * WHERE id = :id!
 * ```
 */
export const getSeasonById = new PreparedQuery<IGetSeasonByIdParams,IGetSeasonByIdResult>(getSeasonByIdIR);


/** 'CloseSeasonById' parameters type */
export interface ICloseSeasonByIdParams {
  id: number;
}

/** 'CloseSeasonById' return type */
export interface ICloseSeasonByIdResult {
  id: number;
}

/** 'CloseSeasonById' query type */
export interface ICloseSeasonByIdQuery {
  params: ICloseSeasonByIdParams;
  result: ICloseSeasonByIdResult;
}

const closeSeasonByIdIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":44,"b":47}]}],"statement":"UPDATE seasons\nSET closed = TRUE\nWHERE id = :id!\nRETURNING id"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE seasons
 * SET closed = TRUE
 * WHERE id = :id!
 * RETURNING id
 * ```
 */
export const closeSeasonById = new PreparedQuery<ICloseSeasonByIdParams,ICloseSeasonByIdResult>(closeSeasonByIdIR);


/** 'GetSeasonResultsById' parameters type */
export interface IGetSeasonResultsByIdParams {
  id: number;
}

/** 'GetSeasonResultsById' return type */
export interface IGetSeasonResultsByIdResult {
  bets_closed: number | null;
  bets_failures: number | null;
  bets_successes: number | null;
  largest_payout_better_discord_id: string | null;
  largest_payout_better_id: string | null;
  largest_payout_prediction_id: number | null;
  largest_payout_value: number | null;
  largest_penalty_better_discord_id: string | null;
  largest_penalty_better_id: string | null;
  largest_penalty_prediction_id: number | null;
  largest_penalty_value: number | null;
  predictions_closed: number | null;
  predictions_failures: number | null;
  predictions_successes: number | null;
  scores_payouts: string | null;
  scores_penalties: string | null;
  season_closed: boolean;
  season_end: Date;
  season_id: number;
  season_name: string;
  season_start: Date;
  season_wager_cap: number;
}

/** 'GetSeasonResultsById' query type */
export interface IGetSeasonResultsByIdQuery {
  params: IGetSeasonResultsByIdParams;
  result: IGetSeasonResultsByIdResult;
}

const getSeasonResultsByIdIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":120,"b":123},{"a":398,"b":401},{"a":859,"b":862},{"a":1339,"b":1342},{"a":1684,"b":1687},{"a":2118,"b":2121}]}],"statement":"WITH season AS (\n  SELECT\n    id,\n    name,\n    start,\n    \"end\",\n    wager_cap,\n    closed\n  FROM seasons\n  WHERE id = :id!\n),\nprediction_stats AS (\n  SELECT\n    COUNT(*) FILTER (WHERE closed_date IS NOT NULL)::int AS closed,\n    COUNT(*) FILTER (WHERE status = 'successful')::int AS successes,\n    COUNT(*) FILTER (WHERE status = 'failed')::int AS failures\n  FROM predictions\n  WHERE season_id = :id!\n),\nbet_stats AS (\n  SELECT\n    COUNT(bets.*) FILTER (WHERE predictions.closed_date IS NOT NULL)::int AS closed,\n    COUNT(bets.*) FILTER (\n      WHERE bets.season_payout IS NOT NULL AND bets.season_payout > 0\n    )::int AS successes,\n    COUNT(bets.*) FILTER (\n      WHERE bets.season_payout IS NOT NULL AND bets.season_payout < 0\n    )::int AS failures\n  FROM bets\n  JOIN predictions ON predictions.id = bets.prediction_id\n  WHERE predictions.season_id = :id! AND bets.valid IS TRUE\n),\nscore_stats AS (\n  SELECT\n    COALESCE(\n      SUM(bets.season_payout) FILTER (\n        WHERE bets.season_payout IS NOT NULL AND bets.season_payout > 0\n      ),\n      0\n    ) AS payouts,\n    COALESCE(\n      SUM(bets.season_payout) FILTER (\n        WHERE bets.season_payout IS NOT NULL AND bets.season_payout < 0\n      ),\n      0\n    ) AS penalties\n  FROM bets\n  JOIN predictions ON predictions.id = bets.prediction_id\n  WHERE predictions.season_id = :id! AND bets.valid IS TRUE\n),\nlargest_payout AS (\n  SELECT\n    bets.season_payout AS value,\n    predictions.id AS prediction_id,\n    users.id AS better_id,\n    users.discord_id AS better_discord_id\n  FROM bets\n  JOIN predictions ON predictions.id = bets.prediction_id\n  JOIN users ON users.id = bets.user_id\n  WHERE\n    predictions.season_id = :id!\n    AND bets.valid IS TRUE\n    AND bets.season_payout IS NOT NULL\n  ORDER BY bets.season_payout DESC\n  LIMIT 1\n),\nlargest_penalty AS (\n  SELECT\n    bets.season_payout AS value,\n    predictions.id AS prediction_id,\n    users.id AS better_id,\n    users.discord_id AS better_discord_id\n  FROM bets\n  JOIN predictions ON predictions.id = bets.prediction_id\n  JOIN users ON users.id = bets.user_id\n  WHERE\n    predictions.season_id = :id!\n    AND bets.valid IS TRUE\n    AND bets.season_payout IS NOT NULL\n  ORDER BY bets.season_payout ASC\n  LIMIT 1\n)\nSELECT\n  season.id AS season_id,\n  season.name AS season_name,\n  season.start AS season_start,\n  season.\"end\" AS season_end,\n  season.wager_cap AS season_wager_cap,\n  season.closed AS season_closed,\n  prediction_stats.closed AS predictions_closed,\n  prediction_stats.successes AS predictions_successes,\n  prediction_stats.failures AS predictions_failures,\n  bet_stats.closed AS bets_closed,\n  bet_stats.successes AS bets_successes,\n  bet_stats.failures AS bets_failures,\n  score_stats.payouts AS scores_payouts,\n  score_stats.penalties AS scores_penalties,\n  largest_payout.value AS largest_payout_value,\n  CASE\n    WHEN largest_payout.value IS NULL THEN NULL\n    ELSE largest_payout.prediction_id\n  END AS largest_payout_prediction_id,\n  CASE\n    WHEN largest_payout.value IS NULL THEN NULL\n    ELSE largest_payout.better_id\n  END AS largest_payout_better_id,\n  CASE\n    WHEN largest_payout.value IS NULL THEN NULL\n    ELSE largest_payout.better_discord_id\n  END AS largest_payout_better_discord_id,\n  largest_penalty.value AS largest_penalty_value,\n  CASE\n    WHEN largest_penalty.value IS NULL THEN NULL\n    ELSE largest_penalty.prediction_id\n  END AS largest_penalty_prediction_id,\n  CASE\n    WHEN largest_penalty.value IS NULL THEN NULL\n    ELSE largest_penalty.better_id\n  END AS largest_penalty_better_id,\n  CASE\n    WHEN largest_penalty.value IS NULL THEN NULL\n    ELSE largest_penalty.better_discord_id\n  END AS largest_penalty_better_discord_id\nFROM season\nCROSS JOIN prediction_stats\nCROSS JOIN bet_stats\nCROSS JOIN score_stats\nLEFT JOIN largest_payout ON TRUE\nLEFT JOIN largest_penalty ON TRUE"};

/**
 * Query generated from SQL:
 * ```
 * WITH season AS (
 *   SELECT
 *     id,
 *     name,
 *     start,
 *     "end",
 *     wager_cap,
 *     closed
 *   FROM seasons
 *   WHERE id = :id!
 * ),
 * prediction_stats AS (
 *   SELECT
 *     COUNT(*) FILTER (WHERE closed_date IS NOT NULL)::int AS closed,
 *     COUNT(*) FILTER (WHERE status = 'successful')::int AS successes,
 *     COUNT(*) FILTER (WHERE status = 'failed')::int AS failures
 *   FROM predictions
 *   WHERE season_id = :id!
 * ),
 * bet_stats AS (
 *   SELECT
 *     COUNT(bets.*) FILTER (WHERE predictions.closed_date IS NOT NULL)::int AS closed,
 *     COUNT(bets.*) FILTER (
 *       WHERE bets.season_payout IS NOT NULL AND bets.season_payout > 0
 *     )::int AS successes,
 *     COUNT(bets.*) FILTER (
 *       WHERE bets.season_payout IS NOT NULL AND bets.season_payout < 0
 *     )::int AS failures
 *   FROM bets
 *   JOIN predictions ON predictions.id = bets.prediction_id
 *   WHERE predictions.season_id = :id! AND bets.valid IS TRUE
 * ),
 * score_stats AS (
 *   SELECT
 *     COALESCE(
 *       SUM(bets.season_payout) FILTER (
 *         WHERE bets.season_payout IS NOT NULL AND bets.season_payout > 0
 *       ),
 *       0
 *     ) AS payouts,
 *     COALESCE(
 *       SUM(bets.season_payout) FILTER (
 *         WHERE bets.season_payout IS NOT NULL AND bets.season_payout < 0
 *       ),
 *       0
 *     ) AS penalties
 *   FROM bets
 *   JOIN predictions ON predictions.id = bets.prediction_id
 *   WHERE predictions.season_id = :id! AND bets.valid IS TRUE
 * ),
 * largest_payout AS (
 *   SELECT
 *     bets.season_payout AS value,
 *     predictions.id AS prediction_id,
 *     users.id AS better_id,
 *     users.discord_id AS better_discord_id
 *   FROM bets
 *   JOIN predictions ON predictions.id = bets.prediction_id
 *   JOIN users ON users.id = bets.user_id
 *   WHERE
 *     predictions.season_id = :id!
 *     AND bets.valid IS TRUE
 *     AND bets.season_payout IS NOT NULL
 *   ORDER BY bets.season_payout DESC
 *   LIMIT 1
 * ),
 * largest_penalty AS (
 *   SELECT
 *     bets.season_payout AS value,
 *     predictions.id AS prediction_id,
 *     users.id AS better_id,
 *     users.discord_id AS better_discord_id
 *   FROM bets
 *   JOIN predictions ON predictions.id = bets.prediction_id
 *   JOIN users ON users.id = bets.user_id
 *   WHERE
 *     predictions.season_id = :id!
 *     AND bets.valid IS TRUE
 *     AND bets.season_payout IS NOT NULL
 *   ORDER BY bets.season_payout ASC
 *   LIMIT 1
 * )
 * SELECT
 *   season.id AS season_id,
 *   season.name AS season_name,
 *   season.start AS season_start,
 *   season."end" AS season_end,
 *   season.wager_cap AS season_wager_cap,
 *   season.closed AS season_closed,
 *   prediction_stats.closed AS predictions_closed,
 *   prediction_stats.successes AS predictions_successes,
 *   prediction_stats.failures AS predictions_failures,
 *   bet_stats.closed AS bets_closed,
 *   bet_stats.successes AS bets_successes,
 *   bet_stats.failures AS bets_failures,
 *   score_stats.payouts AS scores_payouts,
 *   score_stats.penalties AS scores_penalties,
 *   largest_payout.value AS largest_payout_value,
 *   CASE
 *     WHEN largest_payout.value IS NULL THEN NULL
 *     ELSE largest_payout.prediction_id
 *   END AS largest_payout_prediction_id,
 *   CASE
 *     WHEN largest_payout.value IS NULL THEN NULL
 *     ELSE largest_payout.better_id
 *   END AS largest_payout_better_id,
 *   CASE
 *     WHEN largest_payout.value IS NULL THEN NULL
 *     ELSE largest_payout.better_discord_id
 *   END AS largest_payout_better_discord_id,
 *   largest_penalty.value AS largest_penalty_value,
 *   CASE
 *     WHEN largest_penalty.value IS NULL THEN NULL
 *     ELSE largest_penalty.prediction_id
 *   END AS largest_penalty_prediction_id,
 *   CASE
 *     WHEN largest_penalty.value IS NULL THEN NULL
 *     ELSE largest_penalty.better_id
 *   END AS largest_penalty_better_id,
 *   CASE
 *     WHEN largest_penalty.value IS NULL THEN NULL
 *     ELSE largest_penalty.better_discord_id
 *   END AS largest_penalty_better_discord_id
 * FROM season
 * CROSS JOIN prediction_stats
 * CROSS JOIN bet_stats
 * CROSS JOIN score_stats
 * LEFT JOIN largest_payout ON TRUE
 * LEFT JOIN largest_penalty ON TRUE
 * ```
 */
export const getSeasonResultsById = new PreparedQuery<IGetSeasonResultsByIdParams,IGetSeasonResultsByIdResult>(getSeasonResultsByIdIR);


