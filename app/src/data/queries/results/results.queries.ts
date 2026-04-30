/** Types generated for queries found in "src/data/queries/results/results.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type NumberOrString = number | string;

/** 'UserParticipatesInSeason' parameters type */
export interface IUserParticipatesInSeasonParams {
  season_id: number;
  user_id: string;
}

/** 'UserParticipatesInSeason' return type */
export interface IUserParticipatesInSeasonResult {
  participates: boolean | null;
}

/** 'UserParticipatesInSeason' query type */
export interface IUserParticipatesInSeasonQuery {
  params: IUserParticipatesInSeasonParams;
  result: IUserParticipatesInSeasonResult;
}

const userParticipatesInSeasonIR: any = {"usedParamSet":{"season_id":true,"user_id":true},"params":[{"name":"season_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":90,"b":100},{"a":242,"b":252},{"a":395,"b":405}]},{"name":"user_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":118,"b":126},{"a":270,"b":278},{"a":423,"b":431}]}],"statement":"SELECT EXISTS (\n  SELECT 1 FROM (\n    SELECT 1 FROM predictions p\n    WHERE p.season_id = :season_id! AND p.user_id = :user_id!\n    UNION\n    SELECT 1 FROM bets b\n    INNER JOIN predictions p ON p.id = b.prediction_id\n    WHERE p.season_id = :season_id! AND b.user_id = :user_id!\n    UNION\n    SELECT 1 FROM votes v\n    INNER JOIN predictions p ON p.id = v.prediction_id\n    WHERE p.season_id = :season_id! AND v.user_id = :user_id!\n  ) t\n) AS participates"};

/**
 * Query generated from SQL:
 * ```
 * SELECT EXISTS (
 *   SELECT 1 FROM (
 *     SELECT 1 FROM predictions p
 *     WHERE p.season_id = :season_id! AND p.user_id = :user_id!
 *     UNION
 *     SELECT 1 FROM bets b
 *     INNER JOIN predictions p ON p.id = b.prediction_id
 *     WHERE p.season_id = :season_id! AND b.user_id = :user_id!
 *     UNION
 *     SELECT 1 FROM votes v
 *     INNER JOIN predictions p ON p.id = v.prediction_id
 *     WHERE p.season_id = :season_id! AND v.user_id = :user_id!
 *   ) t
 * ) AS participates
 * ```
 */
export const userParticipatesInSeason = new PreparedQuery<IUserParticipatesInSeasonParams,IUserParticipatesInSeasonResult>(userParticipatesInSeasonIR);


/** 'GetSeasonResultsLeaderboard' parameters type */
export interface IGetSeasonResultsLeaderboardParams {
  limit: NumberOrString;
  row_offset: NumberOrString;
  season_id: number;
  sort_by?: string | null | void;
}

/** 'GetSeasonResultsLeaderboard' return type */
export interface IGetSeasonResultsLeaderboardResult {
  bets_failed: number | null;
  bets_invalid: number | null;
  bets_pending: number | null;
  bets_retired: number | null;
  bets_successful: number | null;
  discord_id: string;
  points_net: number | null;
  points_penalties: number | null;
  points_rewards: number | null;
  predictions_checking: number | null;
  predictions_closed: number | null;
  predictions_failed: number | null;
  predictions_open: number | null;
  predictions_retired: number | null;
  predictions_successful: number | null;
  rank_bets_successful: number | null;
  rank_points_net: number | null;
  rank_predictions_successful: number | null;
  user_id: string | null;
  votes_no: number | null;
  votes_pending: number | null;
  votes_yes: number | null;
}

/** 'GetSeasonResultsLeaderboard' query type */
export interface IGetSeasonResultsLeaderboardQuery {
  params: IGetSeasonResultsLeaderboardParams;
  result: IGetSeasonResultsLeaderboardResult;
}

const getSeasonResultsLeaderboardIR: any = {"usedParamSet":{"season_id":true,"sort_by":true,"limit":true,"row_offset":true},"params":[{"name":"season_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":130,"b":140},{"a":264,"b":274},{"a":399,"b":409},{"a":1016,"b":1026},{"a":1926,"b":1936},{"a":2294,"b":2304},{"a":2713,"b":2723}]},{"name":"sort_by","required":false,"transform":{"type":"scalar"},"locs":[{"a":5350,"b":5357},{"a":5438,"b":5445},{"a":5524,"b":5531},{"a":5636,"b":5643},{"a":5746,"b":5753},{"a":5844,"b":5851}]},{"name":"limit","required":true,"transform":{"type":"scalar"},"locs":[{"a":6029,"b":6035}]},{"name":"row_offset","required":true,"transform":{"type":"scalar"},"locs":[{"a":6044,"b":6055}]}],"statement":"WITH participants AS (\n  SELECT DISTINCT uid AS user_id FROM (\n    SELECT p.user_id AS uid FROM predictions p WHERE p.season_id = :season_id!\n    UNION\n    SELECT b.user_id FROM bets b\n    INNER JOIN predictions p ON p.id = b.prediction_id\n    WHERE p.season_id = :season_id!\n    UNION\n    SELECT v.user_id FROM votes v\n    INNER JOIN predictions p ON p.id = v.prediction_id\n    WHERE p.season_id = :season_id!\n  ) x\n),\npred_stats AS (\n  SELECT\n    p.user_id,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'successful')::int AS predictions_successful,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'failed')::int AS predictions_failed,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'open')::int AS predictions_open,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS predictions_closed,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'checking')::int AS predictions_checking,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'retired')::int AS predictions_retired\n  FROM predictions p\n  WHERE p.season_id = :season_id!\n  GROUP BY p.user_id\n),\nbet_stats AS (\n  SELECT\n    b.user_id,\n    COUNT(*) FILTER (\n      WHERE (\n        ((p.status)::text = 'successful' AND b.endorsed IS TRUE) OR\n        ((p.status)::text = 'failed' AND b.endorsed IS FALSE)\n      ) AND b.valid IS TRUE\n    )::int AS bets_successful,\n    COUNT(*) FILTER (\n      WHERE (\n        ((p.status)::text = 'successful' AND b.endorsed IS FALSE) OR\n        ((p.status)::text = 'failed' AND b.endorsed IS TRUE)\n      ) AND b.valid IS TRUE\n    )::int AS bets_failed,\n    COUNT(*) FILTER (\n      WHERE ((p.status)::text IN ('open', 'closed', 'checking')) AND b.valid IS TRUE\n    )::int AS bets_pending,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'retired' AND b.valid IS TRUE)::int AS bets_retired,\n    COUNT(*) FILTER (WHERE b.valid IS FALSE)::int AS bets_invalid\n  FROM bets b\n  INNER JOIN predictions p ON p.id = b.prediction_id\n  WHERE p.season_id = :season_id!\n  GROUP BY b.user_id\n),\nvote_stats AS (\n  SELECT\n    v.user_id,\n    COUNT(*) FILTER (WHERE v.vote IS TRUE)::int AS votes_yes,\n    COUNT(*) FILTER (WHERE v.vote IS FALSE)::int AS votes_no,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS votes_pending\n  FROM votes v\n  INNER JOIN predictions p ON p.id = v.prediction_id\n  WHERE p.season_id = :season_id!\n  GROUP BY v.user_id\n),\npoint_stats AS (\n  SELECT\n    b.user_id,\n    COALESCE(SUM(b.season_payout) FILTER (WHERE b.season_payout > 0), 0)::int AS points_rewards,\n    COALESCE(SUM(b.season_payout) FILTER (WHERE b.season_payout < 0), 0)::int AS points_penalties,\n    COALESCE(SUM(b.season_payout), 0)::int AS points_net\n  FROM bets b\n  INNER JOIN predictions p ON p.id = b.prediction_id\n  WHERE p.season_id = :season_id!\n  GROUP BY b.user_id\n),\njoined AS (\n  SELECT\n    pt.user_id,\n    u.discord_id,\n    COALESCE(pr.predictions_successful, 0) AS predictions_successful,\n    COALESCE(pr.predictions_failed, 0) AS predictions_failed,\n    COALESCE(pr.predictions_open, 0) AS predictions_open,\n    COALESCE(pr.predictions_closed, 0) AS predictions_closed,\n    COALESCE(pr.predictions_checking, 0) AS predictions_checking,\n    COALESCE(pr.predictions_retired, 0) AS predictions_retired,\n    COALESCE(be.bets_successful, 0) AS bets_successful,\n    COALESCE(be.bets_failed, 0) AS bets_failed,\n    COALESCE(be.bets_pending, 0) AS bets_pending,\n    COALESCE(be.bets_retired, 0) AS bets_retired,\n    COALESCE(be.bets_invalid, 0) AS bets_invalid,\n    COALESCE(vo.votes_yes, 0) AS votes_yes,\n    COALESCE(vo.votes_no, 0) AS votes_no,\n    COALESCE(vo.votes_pending, 0) AS votes_pending,\n    COALESCE(po.points_rewards, 0) AS points_rewards,\n    COALESCE(po.points_penalties, 0) AS points_penalties,\n    COALESCE(po.points_net, 0) AS points_net\n  FROM participants pt\n  INNER JOIN users u ON u.id = pt.user_id\n  LEFT JOIN pred_stats pr ON pr.user_id = pt.user_id\n  LEFT JOIN bet_stats be ON be.user_id = pt.user_id\n  LEFT JOIN vote_stats vo ON vo.user_id = pt.user_id\n  LEFT JOIN point_stats po ON po.user_id = pt.user_id\n),\nranked AS (\n  SELECT\n    j.user_id,\n    j.discord_id,\n    j.predictions_successful,\n    j.predictions_failed,\n    j.predictions_open,\n    j.predictions_closed,\n    j.predictions_checking,\n    j.predictions_retired,\n    j.bets_successful,\n    j.bets_failed,\n    j.bets_pending,\n    j.bets_retired,\n    j.bets_invalid,\n    j.votes_yes,\n    j.votes_no,\n    j.votes_pending,\n    j.points_rewards,\n    j.points_penalties,\n    j.points_net,\n    CAST((ROW_NUMBER() OVER (\n      ORDER BY j.points_net DESC, j.user_id ASC\n    )) AS integer) AS rank_points_net,\n    CAST((ROW_NUMBER() OVER (\n      ORDER BY j.predictions_successful DESC, j.user_id ASC\n    )) AS integer) AS rank_predictions_successful,\n    CAST((ROW_NUMBER() OVER (\n      ORDER BY j.bets_successful DESC, j.user_id ASC\n    )) AS integer) AS rank_bets_successful\n  FROM joined j\n)\nSELECT\n  r.user_id,\n  r.discord_id,\n  r.predictions_successful,\n  r.predictions_failed,\n  r.predictions_open,\n  r.predictions_closed,\n  r.predictions_checking,\n  r.predictions_retired,\n  r.bets_successful,\n  r.bets_failed,\n  r.bets_pending,\n  r.bets_retired,\n  r.bets_invalid,\n  r.votes_yes,\n  r.votes_no,\n  r.votes_pending,\n  r.points_rewards,\n  r.points_penalties,\n  r.points_net,\n  r.rank_points_net,\n  r.rank_predictions_successful,\n  r.rank_bets_successful\nFROM ranked r\nORDER BY\n  (CASE WHEN :sort_by::text = 'points_net-desc' THEN r.points_net END) DESC NULLS LAST,\n  (CASE WHEN :sort_by::text = 'points_net-asc' THEN r.points_net END) ASC NULLS LAST,\n  (CASE WHEN :sort_by::text = 'predictions_successful-desc' THEN r.predictions_successful END) DESC NULLS LAST,\n  (CASE WHEN :sort_by::text = 'predictions_successful-asc' THEN r.predictions_successful END) ASC NULLS LAST,\n  (CASE WHEN :sort_by::text = 'bets_successful-desc' THEN r.bets_successful END) DESC NULLS LAST,\n  (CASE WHEN :sort_by::text = 'bets_successful-asc' THEN r.bets_successful END) ASC NULLS LAST,\n  r.points_net DESC,\n  r.predictions_successful DESC,\n  r.bets_successful DESC,\n  r.user_id ASC\nLIMIT :limit!\nOFFSET :row_offset!"};

/**
 * Query generated from SQL:
 * ```
 * WITH participants AS (
 *   SELECT DISTINCT uid AS user_id FROM (
 *     SELECT p.user_id AS uid FROM predictions p WHERE p.season_id = :season_id!
 *     UNION
 *     SELECT b.user_id FROM bets b
 *     INNER JOIN predictions p ON p.id = b.prediction_id
 *     WHERE p.season_id = :season_id!
 *     UNION
 *     SELECT v.user_id FROM votes v
 *     INNER JOIN predictions p ON p.id = v.prediction_id
 *     WHERE p.season_id = :season_id!
 *   ) x
 * ),
 * pred_stats AS (
 *   SELECT
 *     p.user_id,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'successful')::int AS predictions_successful,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'failed')::int AS predictions_failed,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'open')::int AS predictions_open,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS predictions_closed,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'checking')::int AS predictions_checking,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'retired')::int AS predictions_retired
 *   FROM predictions p
 *   WHERE p.season_id = :season_id!
 *   GROUP BY p.user_id
 * ),
 * bet_stats AS (
 *   SELECT
 *     b.user_id,
 *     COUNT(*) FILTER (
 *       WHERE (
 *         ((p.status)::text = 'successful' AND b.endorsed IS TRUE) OR
 *         ((p.status)::text = 'failed' AND b.endorsed IS FALSE)
 *       ) AND b.valid IS TRUE
 *     )::int AS bets_successful,
 *     COUNT(*) FILTER (
 *       WHERE (
 *         ((p.status)::text = 'successful' AND b.endorsed IS FALSE) OR
 *         ((p.status)::text = 'failed' AND b.endorsed IS TRUE)
 *       ) AND b.valid IS TRUE
 *     )::int AS bets_failed,
 *     COUNT(*) FILTER (
 *       WHERE ((p.status)::text IN ('open', 'closed', 'checking')) AND b.valid IS TRUE
 *     )::int AS bets_pending,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'retired' AND b.valid IS TRUE)::int AS bets_retired,
 *     COUNT(*) FILTER (WHERE b.valid IS FALSE)::int AS bets_invalid
 *   FROM bets b
 *   INNER JOIN predictions p ON p.id = b.prediction_id
 *   WHERE p.season_id = :season_id!
 *   GROUP BY b.user_id
 * ),
 * vote_stats AS (
 *   SELECT
 *     v.user_id,
 *     COUNT(*) FILTER (WHERE v.vote IS TRUE)::int AS votes_yes,
 *     COUNT(*) FILTER (WHERE v.vote IS FALSE)::int AS votes_no,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS votes_pending
 *   FROM votes v
 *   INNER JOIN predictions p ON p.id = v.prediction_id
 *   WHERE p.season_id = :season_id!
 *   GROUP BY v.user_id
 * ),
 * point_stats AS (
 *   SELECT
 *     b.user_id,
 *     COALESCE(SUM(b.season_payout) FILTER (WHERE b.season_payout > 0), 0)::int AS points_rewards,
 *     COALESCE(SUM(b.season_payout) FILTER (WHERE b.season_payout < 0), 0)::int AS points_penalties,
 *     COALESCE(SUM(b.season_payout), 0)::int AS points_net
 *   FROM bets b
 *   INNER JOIN predictions p ON p.id = b.prediction_id
 *   WHERE p.season_id = :season_id!
 *   GROUP BY b.user_id
 * ),
 * joined AS (
 *   SELECT
 *     pt.user_id,
 *     u.discord_id,
 *     COALESCE(pr.predictions_successful, 0) AS predictions_successful,
 *     COALESCE(pr.predictions_failed, 0) AS predictions_failed,
 *     COALESCE(pr.predictions_open, 0) AS predictions_open,
 *     COALESCE(pr.predictions_closed, 0) AS predictions_closed,
 *     COALESCE(pr.predictions_checking, 0) AS predictions_checking,
 *     COALESCE(pr.predictions_retired, 0) AS predictions_retired,
 *     COALESCE(be.bets_successful, 0) AS bets_successful,
 *     COALESCE(be.bets_failed, 0) AS bets_failed,
 *     COALESCE(be.bets_pending, 0) AS bets_pending,
 *     COALESCE(be.bets_retired, 0) AS bets_retired,
 *     COALESCE(be.bets_invalid, 0) AS bets_invalid,
 *     COALESCE(vo.votes_yes, 0) AS votes_yes,
 *     COALESCE(vo.votes_no, 0) AS votes_no,
 *     COALESCE(vo.votes_pending, 0) AS votes_pending,
 *     COALESCE(po.points_rewards, 0) AS points_rewards,
 *     COALESCE(po.points_penalties, 0) AS points_penalties,
 *     COALESCE(po.points_net, 0) AS points_net
 *   FROM participants pt
 *   INNER JOIN users u ON u.id = pt.user_id
 *   LEFT JOIN pred_stats pr ON pr.user_id = pt.user_id
 *   LEFT JOIN bet_stats be ON be.user_id = pt.user_id
 *   LEFT JOIN vote_stats vo ON vo.user_id = pt.user_id
 *   LEFT JOIN point_stats po ON po.user_id = pt.user_id
 * ),
 * ranked AS (
 *   SELECT
 *     j.user_id,
 *     j.discord_id,
 *     j.predictions_successful,
 *     j.predictions_failed,
 *     j.predictions_open,
 *     j.predictions_closed,
 *     j.predictions_checking,
 *     j.predictions_retired,
 *     j.bets_successful,
 *     j.bets_failed,
 *     j.bets_pending,
 *     j.bets_retired,
 *     j.bets_invalid,
 *     j.votes_yes,
 *     j.votes_no,
 *     j.votes_pending,
 *     j.points_rewards,
 *     j.points_penalties,
 *     j.points_net,
 *     CAST((ROW_NUMBER() OVER (
 *       ORDER BY j.points_net DESC, j.user_id ASC
 *     )) AS integer) AS rank_points_net,
 *     CAST((ROW_NUMBER() OVER (
 *       ORDER BY j.predictions_successful DESC, j.user_id ASC
 *     )) AS integer) AS rank_predictions_successful,
 *     CAST((ROW_NUMBER() OVER (
 *       ORDER BY j.bets_successful DESC, j.user_id ASC
 *     )) AS integer) AS rank_bets_successful
 *   FROM joined j
 * )
 * SELECT
 *   r.user_id,
 *   r.discord_id,
 *   r.predictions_successful,
 *   r.predictions_failed,
 *   r.predictions_open,
 *   r.predictions_closed,
 *   r.predictions_checking,
 *   r.predictions_retired,
 *   r.bets_successful,
 *   r.bets_failed,
 *   r.bets_pending,
 *   r.bets_retired,
 *   r.bets_invalid,
 *   r.votes_yes,
 *   r.votes_no,
 *   r.votes_pending,
 *   r.points_rewards,
 *   r.points_penalties,
 *   r.points_net,
 *   r.rank_points_net,
 *   r.rank_predictions_successful,
 *   r.rank_bets_successful
 * FROM ranked r
 * ORDER BY
 *   (CASE WHEN :sort_by::text = 'points_net-desc' THEN r.points_net END) DESC NULLS LAST,
 *   (CASE WHEN :sort_by::text = 'points_net-asc' THEN r.points_net END) ASC NULLS LAST,
 *   (CASE WHEN :sort_by::text = 'predictions_successful-desc' THEN r.predictions_successful END) DESC NULLS LAST,
 *   (CASE WHEN :sort_by::text = 'predictions_successful-asc' THEN r.predictions_successful END) ASC NULLS LAST,
 *   (CASE WHEN :sort_by::text = 'bets_successful-desc' THEN r.bets_successful END) DESC NULLS LAST,
 *   (CASE WHEN :sort_by::text = 'bets_successful-asc' THEN r.bets_successful END) ASC NULLS LAST,
 *   r.points_net DESC,
 *   r.predictions_successful DESC,
 *   r.bets_successful DESC,
 *   r.user_id ASC
 * LIMIT :limit!
 * OFFSET :row_offset!
 * ```
 */
export const getSeasonResultsLeaderboard = new PreparedQuery<IGetSeasonResultsLeaderboardParams,IGetSeasonResultsLeaderboardResult>(getSeasonResultsLeaderboardIR);


/** 'CountSeasonLeaderboardParticipants' parameters type */
export interface ICountSeasonLeaderboardParticipantsParams {
  season_id: number;
}

/** 'CountSeasonLeaderboardParticipants' return type */
export interface ICountSeasonLeaderboardParticipantsResult {
  total_count: number | null;
}

/** 'CountSeasonLeaderboardParticipants' query type */
export interface ICountSeasonLeaderboardParticipantsQuery {
  params: ICountSeasonLeaderboardParticipantsParams;
  result: ICountSeasonLeaderboardParticipantsResult;
}

const countSeasonLeaderboardParticipantsIR: any = {"usedParamSet":{"season_id":true},"params":[{"name":"season_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":151,"b":161},{"a":285,"b":295},{"a":420,"b":430}]}],"statement":"SELECT CAST(COUNT(*) AS integer) AS total_count\nFROM (\n  SELECT DISTINCT uid FROM (\n    SELECT p.user_id AS uid FROM predictions p WHERE p.season_id = :season_id!\n    UNION\n    SELECT b.user_id FROM bets b\n    INNER JOIN predictions p ON p.id = b.prediction_id\n    WHERE p.season_id = :season_id!\n    UNION\n    SELECT v.user_id FROM votes v\n    INNER JOIN predictions p ON p.id = v.prediction_id\n    WHERE p.season_id = :season_id!\n  ) x\n) y"};

/**
 * Query generated from SQL:
 * ```
 * SELECT CAST(COUNT(*) AS integer) AS total_count
 * FROM (
 *   SELECT DISTINCT uid FROM (
 *     SELECT p.user_id AS uid FROM predictions p WHERE p.season_id = :season_id!
 *     UNION
 *     SELECT b.user_id FROM bets b
 *     INNER JOIN predictions p ON p.id = b.prediction_id
 *     WHERE p.season_id = :season_id!
 *     UNION
 *     SELECT v.user_id FROM votes v
 *     INNER JOIN predictions p ON p.id = v.prediction_id
 *     WHERE p.season_id = :season_id!
 *   ) x
 * ) y
 * ```
 */
export const countSeasonLeaderboardParticipants = new PreparedQuery<ICountSeasonLeaderboardParticipantsParams,ICountSeasonLeaderboardParticipantsResult>(countSeasonLeaderboardParticipantsIR);


/** 'GetSeasonResultForUser' parameters type */
export interface IGetSeasonResultForUserParams {
  season_id: number;
  user_id: string;
}

/** 'GetSeasonResultForUser' return type */
export interface IGetSeasonResultForUserResult {
  bets_failed: number | null;
  bets_invalid: number | null;
  bets_pending: number | null;
  bets_retired: number | null;
  bets_successful: number | null;
  discord_id: string;
  points_net: number | null;
  points_penalties: number | null;
  points_rewards: number | null;
  predictions_checking: number | null;
  predictions_closed: number | null;
  predictions_failed: number | null;
  predictions_open: number | null;
  predictions_retired: number | null;
  predictions_successful: number | null;
  rank_bets_successful: number | null;
  rank_points_net: number | null;
  rank_predictions_successful: number | null;
  total_participants: number | null;
  user_id: string | null;
  votes_no: number | null;
  votes_pending: number | null;
  votes_yes: number | null;
}

/** 'GetSeasonResultForUser' query type */
export interface IGetSeasonResultForUserQuery {
  params: IGetSeasonResultForUserParams;
  result: IGetSeasonResultForUserResult;
}

const getSeasonResultForUserIR: any = {"usedParamSet":{"season_id":true,"user_id":true},"params":[{"name":"season_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":130,"b":140},{"a":264,"b":274},{"a":399,"b":409},{"a":1016,"b":1026},{"a":1926,"b":1936},{"a":2294,"b":2304},{"a":2713,"b":2723}]},{"name":"user_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":5433,"b":5441}]}],"statement":"WITH participants AS (\n  SELECT DISTINCT uid AS user_id FROM (\n    SELECT p.user_id AS uid FROM predictions p WHERE p.season_id = :season_id!\n    UNION\n    SELECT b.user_id FROM bets b\n    INNER JOIN predictions p ON p.id = b.prediction_id\n    WHERE p.season_id = :season_id!\n    UNION\n    SELECT v.user_id FROM votes v\n    INNER JOIN predictions p ON p.id = v.prediction_id\n    WHERE p.season_id = :season_id!\n  ) x\n),\npred_stats AS (\n  SELECT\n    p.user_id,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'successful')::int AS predictions_successful,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'failed')::int AS predictions_failed,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'open')::int AS predictions_open,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS predictions_closed,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'checking')::int AS predictions_checking,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'retired')::int AS predictions_retired\n  FROM predictions p\n  WHERE p.season_id = :season_id!\n  GROUP BY p.user_id\n),\nbet_stats AS (\n  SELECT\n    b.user_id,\n    COUNT(*) FILTER (\n      WHERE (\n        ((p.status)::text = 'successful' AND b.endorsed IS TRUE) OR\n        ((p.status)::text = 'failed' AND b.endorsed IS FALSE)\n      ) AND b.valid IS TRUE\n    )::int AS bets_successful,\n    COUNT(*) FILTER (\n      WHERE (\n        ((p.status)::text = 'successful' AND b.endorsed IS FALSE) OR\n        ((p.status)::text = 'failed' AND b.endorsed IS TRUE)\n      ) AND b.valid IS TRUE\n    )::int AS bets_failed,\n    COUNT(*) FILTER (\n      WHERE ((p.status)::text IN ('open', 'closed', 'checking')) AND b.valid IS TRUE\n    )::int AS bets_pending,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'retired' AND b.valid IS TRUE)::int AS bets_retired,\n    COUNT(*) FILTER (WHERE b.valid IS FALSE)::int AS bets_invalid\n  FROM bets b\n  INNER JOIN predictions p ON p.id = b.prediction_id\n  WHERE p.season_id = :season_id!\n  GROUP BY b.user_id\n),\nvote_stats AS (\n  SELECT\n    v.user_id,\n    COUNT(*) FILTER (WHERE v.vote IS TRUE)::int AS votes_yes,\n    COUNT(*) FILTER (WHERE v.vote IS FALSE)::int AS votes_no,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS votes_pending\n  FROM votes v\n  INNER JOIN predictions p ON p.id = v.prediction_id\n  WHERE p.season_id = :season_id!\n  GROUP BY v.user_id\n),\npoint_stats AS (\n  SELECT\n    b.user_id,\n    COALESCE(SUM(b.season_payout) FILTER (WHERE b.season_payout > 0), 0)::int AS points_rewards,\n    COALESCE(SUM(b.season_payout) FILTER (WHERE b.season_payout < 0), 0)::int AS points_penalties,\n    COALESCE(SUM(b.season_payout), 0)::int AS points_net\n  FROM bets b\n  INNER JOIN predictions p ON p.id = b.prediction_id\n  WHERE p.season_id = :season_id!\n  GROUP BY b.user_id\n),\njoined AS (\n  SELECT\n    pt.user_id,\n    u.discord_id,\n    COALESCE(pr.predictions_successful, 0) AS predictions_successful,\n    COALESCE(pr.predictions_failed, 0) AS predictions_failed,\n    COALESCE(pr.predictions_open, 0) AS predictions_open,\n    COALESCE(pr.predictions_closed, 0) AS predictions_closed,\n    COALESCE(pr.predictions_checking, 0) AS predictions_checking,\n    COALESCE(pr.predictions_retired, 0) AS predictions_retired,\n    COALESCE(be.bets_successful, 0) AS bets_successful,\n    COALESCE(be.bets_failed, 0) AS bets_failed,\n    COALESCE(be.bets_pending, 0) AS bets_pending,\n    COALESCE(be.bets_retired, 0) AS bets_retired,\n    COALESCE(be.bets_invalid, 0) AS bets_invalid,\n    COALESCE(vo.votes_yes, 0) AS votes_yes,\n    COALESCE(vo.votes_no, 0) AS votes_no,\n    COALESCE(vo.votes_pending, 0) AS votes_pending,\n    COALESCE(po.points_rewards, 0) AS points_rewards,\n    COALESCE(po.points_penalties, 0) AS points_penalties,\n    COALESCE(po.points_net, 0) AS points_net\n  FROM participants pt\n  INNER JOIN users u ON u.id = pt.user_id\n  LEFT JOIN pred_stats pr ON pr.user_id = pt.user_id\n  LEFT JOIN bet_stats be ON be.user_id = pt.user_id\n  LEFT JOIN vote_stats vo ON vo.user_id = pt.user_id\n  LEFT JOIN point_stats po ON po.user_id = pt.user_id\n),\nranked AS (\n  SELECT\n    j.user_id,\n    j.discord_id,\n    j.predictions_successful,\n    j.predictions_failed,\n    j.predictions_open,\n    j.predictions_closed,\n    j.predictions_checking,\n    j.predictions_retired,\n    j.bets_successful,\n    j.bets_failed,\n    j.bets_pending,\n    j.bets_retired,\n    j.bets_invalid,\n    j.votes_yes,\n    j.votes_no,\n    j.votes_pending,\n    j.points_rewards,\n    j.points_penalties,\n    j.points_net,\n    CAST((ROW_NUMBER() OVER (\n      ORDER BY j.points_net DESC, j.user_id ASC\n    )) AS integer) AS rank_points_net,\n    CAST((ROW_NUMBER() OVER (\n      ORDER BY j.predictions_successful DESC, j.user_id ASC\n    )) AS integer) AS rank_predictions_successful,\n    CAST((ROW_NUMBER() OVER (\n      ORDER BY j.bets_successful DESC, j.user_id ASC\n    )) AS integer) AS rank_bets_successful,\n    CAST((COUNT(*) OVER ()) AS integer) AS total_participants\n  FROM joined j\n)\nSELECT\n  r.user_id,\n  r.discord_id,\n  r.predictions_successful,\n  r.predictions_failed,\n  r.predictions_open,\n  r.predictions_closed,\n  r.predictions_checking,\n  r.predictions_retired,\n  r.bets_successful,\n  r.bets_failed,\n  r.bets_pending,\n  r.bets_retired,\n  r.bets_invalid,\n  r.votes_yes,\n  r.votes_no,\n  r.votes_pending,\n  r.points_rewards,\n  r.points_penalties,\n  r.points_net,\n  r.rank_points_net,\n  r.rank_predictions_successful,\n  r.rank_bets_successful,\n  r.total_participants\nFROM ranked r\nWHERE r.user_id = :user_id!"};

/**
 * Query generated from SQL:
 * ```
 * WITH participants AS (
 *   SELECT DISTINCT uid AS user_id FROM (
 *     SELECT p.user_id AS uid FROM predictions p WHERE p.season_id = :season_id!
 *     UNION
 *     SELECT b.user_id FROM bets b
 *     INNER JOIN predictions p ON p.id = b.prediction_id
 *     WHERE p.season_id = :season_id!
 *     UNION
 *     SELECT v.user_id FROM votes v
 *     INNER JOIN predictions p ON p.id = v.prediction_id
 *     WHERE p.season_id = :season_id!
 *   ) x
 * ),
 * pred_stats AS (
 *   SELECT
 *     p.user_id,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'successful')::int AS predictions_successful,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'failed')::int AS predictions_failed,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'open')::int AS predictions_open,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS predictions_closed,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'checking')::int AS predictions_checking,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'retired')::int AS predictions_retired
 *   FROM predictions p
 *   WHERE p.season_id = :season_id!
 *   GROUP BY p.user_id
 * ),
 * bet_stats AS (
 *   SELECT
 *     b.user_id,
 *     COUNT(*) FILTER (
 *       WHERE (
 *         ((p.status)::text = 'successful' AND b.endorsed IS TRUE) OR
 *         ((p.status)::text = 'failed' AND b.endorsed IS FALSE)
 *       ) AND b.valid IS TRUE
 *     )::int AS bets_successful,
 *     COUNT(*) FILTER (
 *       WHERE (
 *         ((p.status)::text = 'successful' AND b.endorsed IS FALSE) OR
 *         ((p.status)::text = 'failed' AND b.endorsed IS TRUE)
 *       ) AND b.valid IS TRUE
 *     )::int AS bets_failed,
 *     COUNT(*) FILTER (
 *       WHERE ((p.status)::text IN ('open', 'closed', 'checking')) AND b.valid IS TRUE
 *     )::int AS bets_pending,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'retired' AND b.valid IS TRUE)::int AS bets_retired,
 *     COUNT(*) FILTER (WHERE b.valid IS FALSE)::int AS bets_invalid
 *   FROM bets b
 *   INNER JOIN predictions p ON p.id = b.prediction_id
 *   WHERE p.season_id = :season_id!
 *   GROUP BY b.user_id
 * ),
 * vote_stats AS (
 *   SELECT
 *     v.user_id,
 *     COUNT(*) FILTER (WHERE v.vote IS TRUE)::int AS votes_yes,
 *     COUNT(*) FILTER (WHERE v.vote IS FALSE)::int AS votes_no,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS votes_pending
 *   FROM votes v
 *   INNER JOIN predictions p ON p.id = v.prediction_id
 *   WHERE p.season_id = :season_id!
 *   GROUP BY v.user_id
 * ),
 * point_stats AS (
 *   SELECT
 *     b.user_id,
 *     COALESCE(SUM(b.season_payout) FILTER (WHERE b.season_payout > 0), 0)::int AS points_rewards,
 *     COALESCE(SUM(b.season_payout) FILTER (WHERE b.season_payout < 0), 0)::int AS points_penalties,
 *     COALESCE(SUM(b.season_payout), 0)::int AS points_net
 *   FROM bets b
 *   INNER JOIN predictions p ON p.id = b.prediction_id
 *   WHERE p.season_id = :season_id!
 *   GROUP BY b.user_id
 * ),
 * joined AS (
 *   SELECT
 *     pt.user_id,
 *     u.discord_id,
 *     COALESCE(pr.predictions_successful, 0) AS predictions_successful,
 *     COALESCE(pr.predictions_failed, 0) AS predictions_failed,
 *     COALESCE(pr.predictions_open, 0) AS predictions_open,
 *     COALESCE(pr.predictions_closed, 0) AS predictions_closed,
 *     COALESCE(pr.predictions_checking, 0) AS predictions_checking,
 *     COALESCE(pr.predictions_retired, 0) AS predictions_retired,
 *     COALESCE(be.bets_successful, 0) AS bets_successful,
 *     COALESCE(be.bets_failed, 0) AS bets_failed,
 *     COALESCE(be.bets_pending, 0) AS bets_pending,
 *     COALESCE(be.bets_retired, 0) AS bets_retired,
 *     COALESCE(be.bets_invalid, 0) AS bets_invalid,
 *     COALESCE(vo.votes_yes, 0) AS votes_yes,
 *     COALESCE(vo.votes_no, 0) AS votes_no,
 *     COALESCE(vo.votes_pending, 0) AS votes_pending,
 *     COALESCE(po.points_rewards, 0) AS points_rewards,
 *     COALESCE(po.points_penalties, 0) AS points_penalties,
 *     COALESCE(po.points_net, 0) AS points_net
 *   FROM participants pt
 *   INNER JOIN users u ON u.id = pt.user_id
 *   LEFT JOIN pred_stats pr ON pr.user_id = pt.user_id
 *   LEFT JOIN bet_stats be ON be.user_id = pt.user_id
 *   LEFT JOIN vote_stats vo ON vo.user_id = pt.user_id
 *   LEFT JOIN point_stats po ON po.user_id = pt.user_id
 * ),
 * ranked AS (
 *   SELECT
 *     j.user_id,
 *     j.discord_id,
 *     j.predictions_successful,
 *     j.predictions_failed,
 *     j.predictions_open,
 *     j.predictions_closed,
 *     j.predictions_checking,
 *     j.predictions_retired,
 *     j.bets_successful,
 *     j.bets_failed,
 *     j.bets_pending,
 *     j.bets_retired,
 *     j.bets_invalid,
 *     j.votes_yes,
 *     j.votes_no,
 *     j.votes_pending,
 *     j.points_rewards,
 *     j.points_penalties,
 *     j.points_net,
 *     CAST((ROW_NUMBER() OVER (
 *       ORDER BY j.points_net DESC, j.user_id ASC
 *     )) AS integer) AS rank_points_net,
 *     CAST((ROW_NUMBER() OVER (
 *       ORDER BY j.predictions_successful DESC, j.user_id ASC
 *     )) AS integer) AS rank_predictions_successful,
 *     CAST((ROW_NUMBER() OVER (
 *       ORDER BY j.bets_successful DESC, j.user_id ASC
 *     )) AS integer) AS rank_bets_successful,
 *     CAST((COUNT(*) OVER ()) AS integer) AS total_participants
 *   FROM joined j
 * )
 * SELECT
 *   r.user_id,
 *   r.discord_id,
 *   r.predictions_successful,
 *   r.predictions_failed,
 *   r.predictions_open,
 *   r.predictions_closed,
 *   r.predictions_checking,
 *   r.predictions_retired,
 *   r.bets_successful,
 *   r.bets_failed,
 *   r.bets_pending,
 *   r.bets_retired,
 *   r.bets_invalid,
 *   r.votes_yes,
 *   r.votes_no,
 *   r.votes_pending,
 *   r.points_rewards,
 *   r.points_penalties,
 *   r.points_net,
 *   r.rank_points_net,
 *   r.rank_predictions_successful,
 *   r.rank_bets_successful,
 *   r.total_participants
 * FROM ranked r
 * WHERE r.user_id = :user_id!
 * ```
 */
export const getSeasonResultForUser = new PreparedQuery<IGetSeasonResultForUserParams,IGetSeasonResultForUserResult>(getSeasonResultForUserIR);


/** 'CountUserSeasonsForResults' parameters type */
export interface ICountUserSeasonsForResultsParams {
  user_id: string;
}

/** 'CountUserSeasonsForResults' return type */
export interface ICountUserSeasonsForResultsResult {
  total_count: number | null;
}

/** 'CountUserSeasonsForResults' query type */
export interface ICountUserSeasonsForResultsQuery {
  params: ICountUserSeasonsForResultsParams;
  result: ICountUserSeasonsForResultsResult;
}

const countUserSeasonsForResultsIR: any = {"usedParamSet":{"user_id":true},"params":[{"name":"user_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":154,"b":162},{"a":314,"b":322},{"a":475,"b":483}]}],"statement":"SELECT CAST(COUNT(*) AS integer) AS total_count\nFROM (\n  SELECT DISTINCT season_id FROM (\n    SELECT p.season_id FROM predictions p\n    WHERE p.user_id = :user_id! AND p.season_id IS NOT NULL\n    UNION\n    SELECT p.season_id FROM bets b\n    INNER JOIN predictions p ON p.id = b.prediction_id\n    WHERE b.user_id = :user_id! AND p.season_id IS NOT NULL\n    UNION\n    SELECT p.season_id FROM votes v\n    INNER JOIN predictions p ON p.id = v.prediction_id\n    WHERE v.user_id = :user_id! AND p.season_id IS NOT NULL\n  ) x\n) s"};

/**
 * Query generated from SQL:
 * ```
 * SELECT CAST(COUNT(*) AS integer) AS total_count
 * FROM (
 *   SELECT DISTINCT season_id FROM (
 *     SELECT p.season_id FROM predictions p
 *     WHERE p.user_id = :user_id! AND p.season_id IS NOT NULL
 *     UNION
 *     SELECT p.season_id FROM bets b
 *     INNER JOIN predictions p ON p.id = b.prediction_id
 *     WHERE b.user_id = :user_id! AND p.season_id IS NOT NULL
 *     UNION
 *     SELECT p.season_id FROM votes v
 *     INNER JOIN predictions p ON p.id = v.prediction_id
 *     WHERE v.user_id = :user_id! AND p.season_id IS NOT NULL
 *   ) x
 * ) s
 * ```
 */
export const countUserSeasonsForResults = new PreparedQuery<ICountUserSeasonsForResultsParams,ICountUserSeasonsForResultsResult>(countUserSeasonsForResultsIR);


/** 'GetUserSeasonResultsPage' parameters type */
export interface IGetUserSeasonResultsPageParams {
  limit: NumberOrString;
  row_offset: NumberOrString;
  sort_by?: string | null | void;
  user_id: string;
}

/** 'GetUserSeasonResultsPage' return type */
export interface IGetUserSeasonResultsPageResult {
  bets_failed: number | null;
  bets_invalid: number | null;
  bets_pending: number | null;
  bets_retired: number | null;
  bets_successful: number | null;
  points_net: number | null;
  points_penalties: number | null;
  points_rewards: number | null;
  predictions_checking: number | null;
  predictions_closed: number | null;
  predictions_failed: number | null;
  predictions_open: number | null;
  predictions_retired: number | null;
  predictions_successful: number | null;
  rank_bets_successful: number | null;
  rank_points_net: number | null;
  rank_predictions_successful: number | null;
  season_end: Date;
  season_id: number;
  season_name: string;
  season_start: Date;
  total_participants: number | null;
  votes_no: number | null;
  votes_pending: number | null;
  votes_yes: number | null;
}

/** 'GetUserSeasonResultsPage' query type */
export interface IGetUserSeasonResultsPageQuery {
  params: IGetUserSeasonResultsPageParams;
  result: IGetUserSeasonResultsPageResult;
}

const getUserSeasonResultsPageIR: any = {"usedParamSet":{"user_id":true,"sort_by":true,"limit":true,"row_offset":true},"params":[{"name":"user_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":122,"b":130},{"a":282,"b":290},{"a":443,"b":451},{"a":7227,"b":7235}]},{"name":"sort_by","required":false,"transform":{"type":"scalar"},"locs":[{"a":655,"b":662},{"a":740,"b":747},{"a":7259,"b":7266},{"a":7343,"b":7350}]},{"name":"limit","required":true,"transform":{"type":"scalar"},"locs":[{"a":829,"b":835}]},{"name":"row_offset","required":true,"transform":{"type":"scalar"},"locs":[{"a":846,"b":857}]}],"statement":"WITH user_seasons AS (\n  SELECT DISTINCT season_id FROM (\n    SELECT p.season_id FROM predictions p\n    WHERE p.user_id = :user_id! AND p.season_id IS NOT NULL\n    UNION\n    SELECT p.season_id FROM bets b\n    INNER JOIN predictions p ON p.id = b.prediction_id\n    WHERE b.user_id = :user_id! AND p.season_id IS NOT NULL\n    UNION\n    SELECT p.season_id FROM votes v\n    INNER JOIN predictions p ON p.id = v.prediction_id\n    WHERE v.user_id = :user_id! AND p.season_id IS NOT NULL\n  ) x\n),\nseason_page AS (\n  SELECT s.id AS season_id, s.name, s.start, s.\"end\"\n  FROM user_seasons us\n  INNER JOIN seasons s ON s.id = us.season_id\n  ORDER BY\n    (CASE WHEN :sort_by::text = 'season_end-desc' THEN s.\"end\" END) DESC NULLS LAST,\n    (CASE WHEN :sort_by::text = 'season_end-asc' THEN s.\"end\" END) ASC NULLS LAST,\n    s.id ASC\n  LIMIT :limit!\n  OFFSET :row_offset!\n),\npage_season_ids AS (\n  SELECT season_id FROM season_page\n),\nparticipants_scoped AS (\n  SELECT DISTINCT season_id, uid AS user_id FROM (\n    SELECT p.season_id, p.user_id AS uid FROM predictions p\n    WHERE p.season_id IN (SELECT season_id FROM page_season_ids)\n    UNION\n    SELECT p.season_id, b.user_id FROM bets b\n    INNER JOIN predictions p ON p.id = b.prediction_id\n    WHERE p.season_id IN (SELECT season_id FROM page_season_ids)\n    UNION\n    SELECT p.season_id, v.user_id FROM votes v\n    INNER JOIN predictions p ON p.id = v.prediction_id\n    WHERE p.season_id IN (SELECT season_id FROM page_season_ids)\n  ) x\n),\npred_stats_all AS (\n  SELECT\n    p.season_id,\n    p.user_id,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'successful')::int AS predictions_successful,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'failed')::int AS predictions_failed,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'open')::int AS predictions_open,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS predictions_closed,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'checking')::int AS predictions_checking,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'retired')::int AS predictions_retired\n  FROM predictions p\n  WHERE p.season_id IN (SELECT season_id FROM page_season_ids)\n  GROUP BY p.season_id, p.user_id\n),\nbet_stats_all AS (\n  SELECT\n    p.season_id,\n    b.user_id,\n    COUNT(*) FILTER (\n      WHERE (\n        ((p.status)::text = 'successful' AND b.endorsed IS TRUE) OR\n        ((p.status)::text = 'failed' AND b.endorsed IS FALSE)\n      ) AND b.valid IS TRUE\n    )::int AS bets_successful,\n    COUNT(*) FILTER (\n      WHERE (\n        ((p.status)::text = 'successful' AND b.endorsed IS FALSE) OR\n        ((p.status)::text = 'failed' AND b.endorsed IS TRUE)\n      ) AND b.valid IS TRUE\n    )::int AS bets_failed,\n    COUNT(*) FILTER (\n      WHERE ((p.status)::text IN ('open', 'closed', 'checking')) AND b.valid IS TRUE\n    )::int AS bets_pending,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'retired' AND b.valid IS TRUE)::int AS bets_retired,\n    COUNT(*) FILTER (WHERE b.valid IS FALSE)::int AS bets_invalid\n  FROM bets b\n  INNER JOIN predictions p ON p.id = b.prediction_id\n  WHERE p.season_id IN (SELECT season_id FROM page_season_ids)\n  GROUP BY p.season_id, b.user_id\n),\nvote_stats_all AS (\n  SELECT\n    p.season_id,\n    v.user_id,\n    COUNT(*) FILTER (WHERE v.vote IS TRUE)::int AS votes_yes,\n    COUNT(*) FILTER (WHERE v.vote IS FALSE)::int AS votes_no,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS votes_pending\n  FROM votes v\n  INNER JOIN predictions p ON p.id = v.prediction_id\n  WHERE p.season_id IN (SELECT season_id FROM page_season_ids)\n  GROUP BY p.season_id, v.user_id\n),\npoint_stats_all AS (\n  SELECT\n    p.season_id,\n    b.user_id,\n    COALESCE(SUM(b.season_payout) FILTER (WHERE b.season_payout > 0), 0)::int AS points_rewards,\n    COALESCE(SUM(b.season_payout) FILTER (WHERE b.season_payout < 0), 0)::int AS points_penalties,\n    COALESCE(SUM(b.season_payout), 0)::int AS points_net\n  FROM bets b\n  INNER JOIN predictions p ON p.id = b.prediction_id\n  WHERE p.season_id IN (SELECT season_id FROM page_season_ids)\n  GROUP BY p.season_id, b.user_id\n),\njoined_all AS (\n  SELECT\n    ps.season_id,\n    ps.user_id,\n    u.discord_id,\n    COALESCE(pr.predictions_successful, 0) AS predictions_successful,\n    COALESCE(pr.predictions_failed, 0) AS predictions_failed,\n    COALESCE(pr.predictions_open, 0) AS predictions_open,\n    COALESCE(pr.predictions_closed, 0) AS predictions_closed,\n    COALESCE(pr.predictions_checking, 0) AS predictions_checking,\n    COALESCE(pr.predictions_retired, 0) AS predictions_retired,\n    COALESCE(be.bets_successful, 0) AS bets_successful,\n    COALESCE(be.bets_failed, 0) AS bets_failed,\n    COALESCE(be.bets_pending, 0) AS bets_pending,\n    COALESCE(be.bets_retired, 0) AS bets_retired,\n    COALESCE(be.bets_invalid, 0) AS bets_invalid,\n    COALESCE(vo.votes_yes, 0) AS votes_yes,\n    COALESCE(vo.votes_no, 0) AS votes_no,\n    COALESCE(vo.votes_pending, 0) AS votes_pending,\n    COALESCE(po.points_rewards, 0) AS points_rewards,\n    COALESCE(po.points_penalties, 0) AS points_penalties,\n    COALESCE(po.points_net, 0) AS points_net\n  FROM participants_scoped ps\n  INNER JOIN users u ON u.id = ps.user_id\n  LEFT JOIN pred_stats_all pr ON pr.season_id = ps.season_id AND pr.user_id = ps.user_id\n  LEFT JOIN bet_stats_all be ON be.season_id = ps.season_id AND be.user_id = ps.user_id\n  LEFT JOIN vote_stats_all vo ON vo.season_id = ps.season_id AND vo.user_id = ps.user_id\n  LEFT JOIN point_stats_all po ON po.season_id = ps.season_id AND po.user_id = ps.user_id\n),\nranked_all AS (\n  SELECT\n    ja.season_id,\n    ja.user_id,\n    ja.discord_id,\n    ja.predictions_successful,\n    ja.predictions_failed,\n    ja.predictions_open,\n    ja.predictions_closed,\n    ja.predictions_checking,\n    ja.predictions_retired,\n    ja.bets_successful,\n    ja.bets_failed,\n    ja.bets_pending,\n    ja.bets_retired,\n    ja.bets_invalid,\n    ja.votes_yes,\n    ja.votes_no,\n    ja.votes_pending,\n    ja.points_rewards,\n    ja.points_penalties,\n    ja.points_net,\n    CAST((ROW_NUMBER() OVER (\n      PARTITION BY ja.season_id ORDER BY ja.points_net DESC, ja.user_id ASC\n    )) AS integer) AS rank_points_net,\n    CAST((ROW_NUMBER() OVER (\n      PARTITION BY ja.season_id ORDER BY ja.predictions_successful DESC, ja.user_id ASC\n    )) AS integer) AS rank_predictions_successful,\n    CAST((ROW_NUMBER() OVER (\n      PARTITION BY ja.season_id ORDER BY ja.bets_successful DESC, ja.user_id ASC\n    )) AS integer) AS rank_bets_successful,\n    CAST((COUNT(*) OVER (PARTITION BY ja.season_id)) AS integer) AS total_participants\n  FROM joined_all ja\n)\nSELECT\n  sp.season_id,\n  sp.name AS season_name,\n  sp.start AS season_start,\n  sp.\"end\" AS season_end,\n  ra.total_participants,\n  ra.predictions_successful,\n  ra.predictions_failed,\n  ra.predictions_open,\n  ra.predictions_closed,\n  ra.predictions_checking,\n  ra.predictions_retired,\n  ra.bets_successful,\n  ra.bets_failed,\n  ra.bets_pending,\n  ra.bets_retired,\n  ra.bets_invalid,\n  ra.votes_yes,\n  ra.votes_no,\n  ra.votes_pending,\n  ra.points_rewards,\n  ra.points_penalties,\n  ra.points_net,\n  ra.rank_points_net,\n  ra.rank_predictions_successful,\n  ra.rank_bets_successful\nFROM season_page sp\nINNER JOIN ranked_all ra ON ra.season_id = sp.season_id AND ra.user_id = :user_id!\nORDER BY\n  (CASE WHEN :sort_by::text = 'season_end-desc' THEN sp.\"end\" END) DESC NULLS LAST,\n  (CASE WHEN :sort_by::text = 'season_end-asc' THEN sp.\"end\" END) ASC NULLS LAST,\n  sp.season_id ASC"};

/**
 * Query generated from SQL:
 * ```
 * WITH user_seasons AS (
 *   SELECT DISTINCT season_id FROM (
 *     SELECT p.season_id FROM predictions p
 *     WHERE p.user_id = :user_id! AND p.season_id IS NOT NULL
 *     UNION
 *     SELECT p.season_id FROM bets b
 *     INNER JOIN predictions p ON p.id = b.prediction_id
 *     WHERE b.user_id = :user_id! AND p.season_id IS NOT NULL
 *     UNION
 *     SELECT p.season_id FROM votes v
 *     INNER JOIN predictions p ON p.id = v.prediction_id
 *     WHERE v.user_id = :user_id! AND p.season_id IS NOT NULL
 *   ) x
 * ),
 * season_page AS (
 *   SELECT s.id AS season_id, s.name, s.start, s."end"
 *   FROM user_seasons us
 *   INNER JOIN seasons s ON s.id = us.season_id
 *   ORDER BY
 *     (CASE WHEN :sort_by::text = 'season_end-desc' THEN s."end" END) DESC NULLS LAST,
 *     (CASE WHEN :sort_by::text = 'season_end-asc' THEN s."end" END) ASC NULLS LAST,
 *     s.id ASC
 *   LIMIT :limit!
 *   OFFSET :row_offset!
 * ),
 * page_season_ids AS (
 *   SELECT season_id FROM season_page
 * ),
 * participants_scoped AS (
 *   SELECT DISTINCT season_id, uid AS user_id FROM (
 *     SELECT p.season_id, p.user_id AS uid FROM predictions p
 *     WHERE p.season_id IN (SELECT season_id FROM page_season_ids)
 *     UNION
 *     SELECT p.season_id, b.user_id FROM bets b
 *     INNER JOIN predictions p ON p.id = b.prediction_id
 *     WHERE p.season_id IN (SELECT season_id FROM page_season_ids)
 *     UNION
 *     SELECT p.season_id, v.user_id FROM votes v
 *     INNER JOIN predictions p ON p.id = v.prediction_id
 *     WHERE p.season_id IN (SELECT season_id FROM page_season_ids)
 *   ) x
 * ),
 * pred_stats_all AS (
 *   SELECT
 *     p.season_id,
 *     p.user_id,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'successful')::int AS predictions_successful,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'failed')::int AS predictions_failed,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'open')::int AS predictions_open,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS predictions_closed,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'checking')::int AS predictions_checking,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'retired')::int AS predictions_retired
 *   FROM predictions p
 *   WHERE p.season_id IN (SELECT season_id FROM page_season_ids)
 *   GROUP BY p.season_id, p.user_id
 * ),
 * bet_stats_all AS (
 *   SELECT
 *     p.season_id,
 *     b.user_id,
 *     COUNT(*) FILTER (
 *       WHERE (
 *         ((p.status)::text = 'successful' AND b.endorsed IS TRUE) OR
 *         ((p.status)::text = 'failed' AND b.endorsed IS FALSE)
 *       ) AND b.valid IS TRUE
 *     )::int AS bets_successful,
 *     COUNT(*) FILTER (
 *       WHERE (
 *         ((p.status)::text = 'successful' AND b.endorsed IS FALSE) OR
 *         ((p.status)::text = 'failed' AND b.endorsed IS TRUE)
 *       ) AND b.valid IS TRUE
 *     )::int AS bets_failed,
 *     COUNT(*) FILTER (
 *       WHERE ((p.status)::text IN ('open', 'closed', 'checking')) AND b.valid IS TRUE
 *     )::int AS bets_pending,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'retired' AND b.valid IS TRUE)::int AS bets_retired,
 *     COUNT(*) FILTER (WHERE b.valid IS FALSE)::int AS bets_invalid
 *   FROM bets b
 *   INNER JOIN predictions p ON p.id = b.prediction_id
 *   WHERE p.season_id IN (SELECT season_id FROM page_season_ids)
 *   GROUP BY p.season_id, b.user_id
 * ),
 * vote_stats_all AS (
 *   SELECT
 *     p.season_id,
 *     v.user_id,
 *     COUNT(*) FILTER (WHERE v.vote IS TRUE)::int AS votes_yes,
 *     COUNT(*) FILTER (WHERE v.vote IS FALSE)::int AS votes_no,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS votes_pending
 *   FROM votes v
 *   INNER JOIN predictions p ON p.id = v.prediction_id
 *   WHERE p.season_id IN (SELECT season_id FROM page_season_ids)
 *   GROUP BY p.season_id, v.user_id
 * ),
 * point_stats_all AS (
 *   SELECT
 *     p.season_id,
 *     b.user_id,
 *     COALESCE(SUM(b.season_payout) FILTER (WHERE b.season_payout > 0), 0)::int AS points_rewards,
 *     COALESCE(SUM(b.season_payout) FILTER (WHERE b.season_payout < 0), 0)::int AS points_penalties,
 *     COALESCE(SUM(b.season_payout), 0)::int AS points_net
 *   FROM bets b
 *   INNER JOIN predictions p ON p.id = b.prediction_id
 *   WHERE p.season_id IN (SELECT season_id FROM page_season_ids)
 *   GROUP BY p.season_id, b.user_id
 * ),
 * joined_all AS (
 *   SELECT
 *     ps.season_id,
 *     ps.user_id,
 *     u.discord_id,
 *     COALESCE(pr.predictions_successful, 0) AS predictions_successful,
 *     COALESCE(pr.predictions_failed, 0) AS predictions_failed,
 *     COALESCE(pr.predictions_open, 0) AS predictions_open,
 *     COALESCE(pr.predictions_closed, 0) AS predictions_closed,
 *     COALESCE(pr.predictions_checking, 0) AS predictions_checking,
 *     COALESCE(pr.predictions_retired, 0) AS predictions_retired,
 *     COALESCE(be.bets_successful, 0) AS bets_successful,
 *     COALESCE(be.bets_failed, 0) AS bets_failed,
 *     COALESCE(be.bets_pending, 0) AS bets_pending,
 *     COALESCE(be.bets_retired, 0) AS bets_retired,
 *     COALESCE(be.bets_invalid, 0) AS bets_invalid,
 *     COALESCE(vo.votes_yes, 0) AS votes_yes,
 *     COALESCE(vo.votes_no, 0) AS votes_no,
 *     COALESCE(vo.votes_pending, 0) AS votes_pending,
 *     COALESCE(po.points_rewards, 0) AS points_rewards,
 *     COALESCE(po.points_penalties, 0) AS points_penalties,
 *     COALESCE(po.points_net, 0) AS points_net
 *   FROM participants_scoped ps
 *   INNER JOIN users u ON u.id = ps.user_id
 *   LEFT JOIN pred_stats_all pr ON pr.season_id = ps.season_id AND pr.user_id = ps.user_id
 *   LEFT JOIN bet_stats_all be ON be.season_id = ps.season_id AND be.user_id = ps.user_id
 *   LEFT JOIN vote_stats_all vo ON vo.season_id = ps.season_id AND vo.user_id = ps.user_id
 *   LEFT JOIN point_stats_all po ON po.season_id = ps.season_id AND po.user_id = ps.user_id
 * ),
 * ranked_all AS (
 *   SELECT
 *     ja.season_id,
 *     ja.user_id,
 *     ja.discord_id,
 *     ja.predictions_successful,
 *     ja.predictions_failed,
 *     ja.predictions_open,
 *     ja.predictions_closed,
 *     ja.predictions_checking,
 *     ja.predictions_retired,
 *     ja.bets_successful,
 *     ja.bets_failed,
 *     ja.bets_pending,
 *     ja.bets_retired,
 *     ja.bets_invalid,
 *     ja.votes_yes,
 *     ja.votes_no,
 *     ja.votes_pending,
 *     ja.points_rewards,
 *     ja.points_penalties,
 *     ja.points_net,
 *     CAST((ROW_NUMBER() OVER (
 *       PARTITION BY ja.season_id ORDER BY ja.points_net DESC, ja.user_id ASC
 *     )) AS integer) AS rank_points_net,
 *     CAST((ROW_NUMBER() OVER (
 *       PARTITION BY ja.season_id ORDER BY ja.predictions_successful DESC, ja.user_id ASC
 *     )) AS integer) AS rank_predictions_successful,
 *     CAST((ROW_NUMBER() OVER (
 *       PARTITION BY ja.season_id ORDER BY ja.bets_successful DESC, ja.user_id ASC
 *     )) AS integer) AS rank_bets_successful,
 *     CAST((COUNT(*) OVER (PARTITION BY ja.season_id)) AS integer) AS total_participants
 *   FROM joined_all ja
 * )
 * SELECT
 *   sp.season_id,
 *   sp.name AS season_name,
 *   sp.start AS season_start,
 *   sp."end" AS season_end,
 *   ra.total_participants,
 *   ra.predictions_successful,
 *   ra.predictions_failed,
 *   ra.predictions_open,
 *   ra.predictions_closed,
 *   ra.predictions_checking,
 *   ra.predictions_retired,
 *   ra.bets_successful,
 *   ra.bets_failed,
 *   ra.bets_pending,
 *   ra.bets_retired,
 *   ra.bets_invalid,
 *   ra.votes_yes,
 *   ra.votes_no,
 *   ra.votes_pending,
 *   ra.points_rewards,
 *   ra.points_penalties,
 *   ra.points_net,
 *   ra.rank_points_net,
 *   ra.rank_predictions_successful,
 *   ra.rank_bets_successful
 * FROM season_page sp
 * INNER JOIN ranked_all ra ON ra.season_id = sp.season_id AND ra.user_id = :user_id!
 * ORDER BY
 *   (CASE WHEN :sort_by::text = 'season_end-desc' THEN sp."end" END) DESC NULLS LAST,
 *   (CASE WHEN :sort_by::text = 'season_end-asc' THEN sp."end" END) ASC NULLS LAST,
 *   sp.season_id ASC
 * ```
 */
export const getUserSeasonResultsPage = new PreparedQuery<IGetUserSeasonResultsPageParams,IGetUserSeasonResultsPageResult>(getUserSeasonResultsPageIR);


/** 'GetAllTimeResultForUser' parameters type */
export interface IGetAllTimeResultForUserParams {
  user_id: string;
}

/** 'GetAllTimeResultForUser' return type */
export interface IGetAllTimeResultForUserResult {
  bets_failed: number | null;
  bets_invalid: number | null;
  bets_pending: number | null;
  bets_retired: number | null;
  bets_successful: number | null;
  discord_id: string;
  points_net: number | null;
  points_penalties: number | null;
  points_rewards: number | null;
  predictions_checking: number | null;
  predictions_closed: number | null;
  predictions_failed: number | null;
  predictions_open: number | null;
  predictions_retired: number | null;
  predictions_successful: number | null;
  rank_bets_successful: number | null;
  rank_points_net: number | null;
  rank_predictions_successful: number | null;
  total_participants: number | null;
  user_id: string;
  votes_no: number | null;
  votes_pending: number | null;
  votes_yes: number | null;
}

/** 'GetAllTimeResultForUser' query type */
export interface IGetAllTimeResultForUserQuery {
  params: IGetAllTimeResultForUserParams;
  result: IGetAllTimeResultForUserResult;
}

const getAllTimeResultForUserIR: any = {"usedParamSet":{"user_id":true},"params":[{"name":"user_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":5569,"b":5577}]}],"statement":"WITH participants AS (\n  SELECT DISTINCT uid AS user_id FROM (\n    SELECT user_id AS uid FROM predictions\n    UNION\n    SELECT user_id FROM bets\n    UNION\n    SELECT user_id FROM votes\n  ) x\n),\npred_stats AS (\n  SELECT\n    p.user_id,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'successful')::int AS predictions_successful,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'failed')::int AS predictions_failed,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'open')::int AS predictions_open,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS predictions_closed,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'checking')::int AS predictions_checking,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'retired')::int AS predictions_retired\n  FROM predictions p\n  GROUP BY p.user_id\n),\nbet_stats AS (\n  SELECT\n    b.user_id,\n    COUNT(*) FILTER (\n      WHERE (\n        ((p.status)::text = 'successful' AND b.endorsed IS TRUE) OR\n        ((p.status)::text = 'failed' AND b.endorsed IS FALSE)\n      ) AND b.valid IS TRUE\n    )::int AS bets_successful,\n    COUNT(*) FILTER (\n      WHERE (\n        ((p.status)::text = 'successful' AND b.endorsed IS FALSE) OR\n        ((p.status)::text = 'failed' AND b.endorsed IS TRUE)\n      ) AND b.valid IS TRUE\n    )::int AS bets_failed,\n    COUNT(*) FILTER (\n      WHERE ((p.status)::text IN ('open', 'closed', 'checking')) AND b.valid IS TRUE\n    )::int AS bets_pending,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'retired' AND b.valid IS TRUE)::int AS bets_retired,\n    COUNT(*) FILTER (WHERE b.valid IS FALSE)::int AS bets_invalid\n  FROM bets b\n  INNER JOIN predictions p ON p.id = b.prediction_id\n  GROUP BY b.user_id\n),\nvote_stats AS (\n  SELECT\n    v.user_id,\n    COUNT(*) FILTER (WHERE v.vote IS TRUE)::int AS votes_yes,\n    COUNT(*) FILTER (WHERE v.vote IS FALSE)::int AS votes_no,\n    COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS votes_pending\n  FROM votes v\n  INNER JOIN predictions p ON p.id = v.prediction_id\n  GROUP BY v.user_id\n),\npoint_stats AS (\n  SELECT\n    b.user_id,\n    COALESCE(SUM(b.payout) FILTER (WHERE b.payout > 0), 0)::int AS points_rewards,\n    COALESCE(SUM(b.payout) FILTER (WHERE b.payout < 0), 0)::int AS points_penalties,\n    COALESCE(SUM(b.payout), 0)::int AS points_net\n  FROM bets b\n  GROUP BY b.user_id\n),\njoined AS (\n  SELECT\n    pt.user_id,\n    u.discord_id,\n    COALESCE(pr.predictions_successful, 0) AS predictions_successful,\n    COALESCE(pr.predictions_failed, 0) AS predictions_failed,\n    COALESCE(pr.predictions_open, 0) AS predictions_open,\n    COALESCE(pr.predictions_closed, 0) AS predictions_closed,\n    COALESCE(pr.predictions_checking, 0) AS predictions_checking,\n    COALESCE(pr.predictions_retired, 0) AS predictions_retired,\n    COALESCE(be.bets_successful, 0) AS bets_successful,\n    COALESCE(be.bets_failed, 0) AS bets_failed,\n    COALESCE(be.bets_pending, 0) AS bets_pending,\n    COALESCE(be.bets_retired, 0) AS bets_retired,\n    COALESCE(be.bets_invalid, 0) AS bets_invalid,\n    COALESCE(vo.votes_yes, 0) AS votes_yes,\n    COALESCE(vo.votes_no, 0) AS votes_no,\n    COALESCE(vo.votes_pending, 0) AS votes_pending,\n    COALESCE(po.points_rewards, 0) AS points_rewards,\n    COALESCE(po.points_penalties, 0) AS points_penalties,\n    COALESCE(po.points_net, 0) AS points_net\n  FROM participants pt\n  INNER JOIN users u ON u.id = pt.user_id\n  LEFT JOIN pred_stats pr ON pr.user_id = pt.user_id\n  LEFT JOIN bet_stats be ON be.user_id = pt.user_id\n  LEFT JOIN vote_stats vo ON vo.user_id = pt.user_id\n  LEFT JOIN point_stats po ON po.user_id = pt.user_id\n),\nranked AS (\n  SELECT\n    j.user_id,\n    j.discord_id,\n    j.predictions_successful,\n    j.predictions_failed,\n    j.predictions_open,\n    j.predictions_closed,\n    j.predictions_checking,\n    j.predictions_retired,\n    j.bets_successful,\n    j.bets_failed,\n    j.bets_pending,\n    j.bets_retired,\n    j.bets_invalid,\n    j.votes_yes,\n    j.votes_no,\n    j.votes_pending,\n    j.points_rewards,\n    j.points_penalties,\n    j.points_net,\n    CAST((ROW_NUMBER() OVER (\n      ORDER BY j.points_net DESC, j.user_id ASC\n    )) AS integer) AS rank_points_net,\n    CAST((ROW_NUMBER() OVER (\n      ORDER BY j.predictions_successful DESC, j.user_id ASC\n    )) AS integer) AS rank_predictions_successful,\n    CAST((ROW_NUMBER() OVER (\n      ORDER BY j.bets_successful DESC, j.user_id ASC\n    )) AS integer) AS rank_bets_successful\n  FROM joined j\n)\nSELECT\n  u.id AS user_id,\n  u.discord_id,\n  COALESCE(rk.predictions_successful, 0) AS predictions_successful,\n  COALESCE(rk.predictions_failed, 0) AS predictions_failed,\n  COALESCE(rk.predictions_open, 0) AS predictions_open,\n  COALESCE(rk.predictions_closed, 0) AS predictions_closed,\n  COALESCE(rk.predictions_checking, 0) AS predictions_checking,\n  COALESCE(rk.predictions_retired, 0) AS predictions_retired,\n  COALESCE(rk.bets_successful, 0) AS bets_successful,\n  COALESCE(rk.bets_failed, 0) AS bets_failed,\n  COALESCE(rk.bets_pending, 0) AS bets_pending,\n  COALESCE(rk.bets_retired, 0) AS bets_retired,\n  COALESCE(rk.bets_invalid, 0) AS bets_invalid,\n  COALESCE(rk.votes_yes, 0) AS votes_yes,\n  COALESCE(rk.votes_no, 0) AS votes_no,\n  COALESCE(rk.votes_pending, 0) AS votes_pending,\n  COALESCE(rk.points_rewards, 0) AS points_rewards,\n  COALESCE(rk.points_penalties, 0) AS points_penalties,\n  COALESCE(rk.points_net, 0) AS points_net,\n  rk.rank_points_net,\n  rk.rank_predictions_successful,\n  rk.rank_bets_successful,\n  (SELECT CAST(COUNT(*) AS integer) FROM participants) AS total_participants\nFROM users u\nLEFT JOIN ranked rk ON rk.user_id = u.id\nWHERE u.id = :user_id!"};

/**
 * Query generated from SQL:
 * ```
 * WITH participants AS (
 *   SELECT DISTINCT uid AS user_id FROM (
 *     SELECT user_id AS uid FROM predictions
 *     UNION
 *     SELECT user_id FROM bets
 *     UNION
 *     SELECT user_id FROM votes
 *   ) x
 * ),
 * pred_stats AS (
 *   SELECT
 *     p.user_id,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'successful')::int AS predictions_successful,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'failed')::int AS predictions_failed,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'open')::int AS predictions_open,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS predictions_closed,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'checking')::int AS predictions_checking,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'retired')::int AS predictions_retired
 *   FROM predictions p
 *   GROUP BY p.user_id
 * ),
 * bet_stats AS (
 *   SELECT
 *     b.user_id,
 *     COUNT(*) FILTER (
 *       WHERE (
 *         ((p.status)::text = 'successful' AND b.endorsed IS TRUE) OR
 *         ((p.status)::text = 'failed' AND b.endorsed IS FALSE)
 *       ) AND b.valid IS TRUE
 *     )::int AS bets_successful,
 *     COUNT(*) FILTER (
 *       WHERE (
 *         ((p.status)::text = 'successful' AND b.endorsed IS FALSE) OR
 *         ((p.status)::text = 'failed' AND b.endorsed IS TRUE)
 *       ) AND b.valid IS TRUE
 *     )::int AS bets_failed,
 *     COUNT(*) FILTER (
 *       WHERE ((p.status)::text IN ('open', 'closed', 'checking')) AND b.valid IS TRUE
 *     )::int AS bets_pending,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'retired' AND b.valid IS TRUE)::int AS bets_retired,
 *     COUNT(*) FILTER (WHERE b.valid IS FALSE)::int AS bets_invalid
 *   FROM bets b
 *   INNER JOIN predictions p ON p.id = b.prediction_id
 *   GROUP BY b.user_id
 * ),
 * vote_stats AS (
 *   SELECT
 *     v.user_id,
 *     COUNT(*) FILTER (WHERE v.vote IS TRUE)::int AS votes_yes,
 *     COUNT(*) FILTER (WHERE v.vote IS FALSE)::int AS votes_no,
 *     COUNT(*) FILTER (WHERE (p.status)::text = 'closed')::int AS votes_pending
 *   FROM votes v
 *   INNER JOIN predictions p ON p.id = v.prediction_id
 *   GROUP BY v.user_id
 * ),
 * point_stats AS (
 *   SELECT
 *     b.user_id,
 *     COALESCE(SUM(b.payout) FILTER (WHERE b.payout > 0), 0)::int AS points_rewards,
 *     COALESCE(SUM(b.payout) FILTER (WHERE b.payout < 0), 0)::int AS points_penalties,
 *     COALESCE(SUM(b.payout), 0)::int AS points_net
 *   FROM bets b
 *   GROUP BY b.user_id
 * ),
 * joined AS (
 *   SELECT
 *     pt.user_id,
 *     u.discord_id,
 *     COALESCE(pr.predictions_successful, 0) AS predictions_successful,
 *     COALESCE(pr.predictions_failed, 0) AS predictions_failed,
 *     COALESCE(pr.predictions_open, 0) AS predictions_open,
 *     COALESCE(pr.predictions_closed, 0) AS predictions_closed,
 *     COALESCE(pr.predictions_checking, 0) AS predictions_checking,
 *     COALESCE(pr.predictions_retired, 0) AS predictions_retired,
 *     COALESCE(be.bets_successful, 0) AS bets_successful,
 *     COALESCE(be.bets_failed, 0) AS bets_failed,
 *     COALESCE(be.bets_pending, 0) AS bets_pending,
 *     COALESCE(be.bets_retired, 0) AS bets_retired,
 *     COALESCE(be.bets_invalid, 0) AS bets_invalid,
 *     COALESCE(vo.votes_yes, 0) AS votes_yes,
 *     COALESCE(vo.votes_no, 0) AS votes_no,
 *     COALESCE(vo.votes_pending, 0) AS votes_pending,
 *     COALESCE(po.points_rewards, 0) AS points_rewards,
 *     COALESCE(po.points_penalties, 0) AS points_penalties,
 *     COALESCE(po.points_net, 0) AS points_net
 *   FROM participants pt
 *   INNER JOIN users u ON u.id = pt.user_id
 *   LEFT JOIN pred_stats pr ON pr.user_id = pt.user_id
 *   LEFT JOIN bet_stats be ON be.user_id = pt.user_id
 *   LEFT JOIN vote_stats vo ON vo.user_id = pt.user_id
 *   LEFT JOIN point_stats po ON po.user_id = pt.user_id
 * ),
 * ranked AS (
 *   SELECT
 *     j.user_id,
 *     j.discord_id,
 *     j.predictions_successful,
 *     j.predictions_failed,
 *     j.predictions_open,
 *     j.predictions_closed,
 *     j.predictions_checking,
 *     j.predictions_retired,
 *     j.bets_successful,
 *     j.bets_failed,
 *     j.bets_pending,
 *     j.bets_retired,
 *     j.bets_invalid,
 *     j.votes_yes,
 *     j.votes_no,
 *     j.votes_pending,
 *     j.points_rewards,
 *     j.points_penalties,
 *     j.points_net,
 *     CAST((ROW_NUMBER() OVER (
 *       ORDER BY j.points_net DESC, j.user_id ASC
 *     )) AS integer) AS rank_points_net,
 *     CAST((ROW_NUMBER() OVER (
 *       ORDER BY j.predictions_successful DESC, j.user_id ASC
 *     )) AS integer) AS rank_predictions_successful,
 *     CAST((ROW_NUMBER() OVER (
 *       ORDER BY j.bets_successful DESC, j.user_id ASC
 *     )) AS integer) AS rank_bets_successful
 *   FROM joined j
 * )
 * SELECT
 *   u.id AS user_id,
 *   u.discord_id,
 *   COALESCE(rk.predictions_successful, 0) AS predictions_successful,
 *   COALESCE(rk.predictions_failed, 0) AS predictions_failed,
 *   COALESCE(rk.predictions_open, 0) AS predictions_open,
 *   COALESCE(rk.predictions_closed, 0) AS predictions_closed,
 *   COALESCE(rk.predictions_checking, 0) AS predictions_checking,
 *   COALESCE(rk.predictions_retired, 0) AS predictions_retired,
 *   COALESCE(rk.bets_successful, 0) AS bets_successful,
 *   COALESCE(rk.bets_failed, 0) AS bets_failed,
 *   COALESCE(rk.bets_pending, 0) AS bets_pending,
 *   COALESCE(rk.bets_retired, 0) AS bets_retired,
 *   COALESCE(rk.bets_invalid, 0) AS bets_invalid,
 *   COALESCE(rk.votes_yes, 0) AS votes_yes,
 *   COALESCE(rk.votes_no, 0) AS votes_no,
 *   COALESCE(rk.votes_pending, 0) AS votes_pending,
 *   COALESCE(rk.points_rewards, 0) AS points_rewards,
 *   COALESCE(rk.points_penalties, 0) AS points_penalties,
 *   COALESCE(rk.points_net, 0) AS points_net,
 *   rk.rank_points_net,
 *   rk.rank_predictions_successful,
 *   rk.rank_bets_successful,
 *   (SELECT CAST(COUNT(*) AS integer) FROM participants) AS total_participants
 * FROM users u
 * LEFT JOIN ranked rk ON rk.user_id = u.id
 * WHERE u.id = :user_id!
 * ```
 */
export const getAllTimeResultForUser = new PreparedQuery<IGetAllTimeResultForUserParams,IGetAllTimeResultForUserResult>(getAllTimeResultForUserIR);


