import { PoolClient } from "pg";
import pool from "../db";
import { APIScores } from "../types/scores";

export const generate_GET_USER_SCORE_SUMMARY_with_SEASON = (
  seasonId?: number | string
) => {
  const seasonFilter = seasonId
    ? ` FILTER (WHERE payouts.season_id = ${seasonId})`
    : "";

  const query = `
    SELECT
        u.id as better_id,
        u.discord_id,
        COALESCE(SUM(payout)${seasonFilter}, 0) as points,
        RANK () OVER (
          ORDER BY 
            COALESCE(SUM(payout)${seasonFilter}, 0) DESC
        )
      FROM users u
      LEFT JOIN payouts ON payouts.better_id = u.id
      GROUP BY u.id`;

  return query;
};

export const generate_GET_USER_PREDICTION_SUMMARY_with_SEASON = (
  seasonId?: number | string
) => {
  const whereClause = seasonId ? ` AND ep.season_id = ${seasonId}` : "";

  const query = `
    SELECT
        u.id,
        u.discord_id,
        RANK () OVER (
          ORDER BY 
            COUNT(DISTINCT ep.prediction_id) FILTER (WHERE (ep.status = 'successful')${whereClause})::INT DESC,
            COUNT(DISTINCT ep.prediction_id) FILTER (WHERE (ep.status = 'failed')${whereClause})::INT ASC
        ) as rank,
        COUNT(DISTINCT ep.prediction_id) FILTER (WHERE (ep.status = 'successful')${whereClause})::INT
          as successful,
        COUNT(DISTINCT ep.prediction_id) FILTER (WHERE (ep.status = 'failed')${whereClause})::INT
          as failed,
        COUNT(DISTINCT ep.prediction_id) FILTER (WHERE (ep.status = 'open' OR ep.status = 'closed')${whereClause})::INT
          as pending,
        COUNT(DISTINCT ep.prediction_id) FILTER (WHERE (ep.status = 'retired')${whereClause})::INT
          as retired
      FROM users u
      LEFT JOIN enhanced_predictions ep ON ep.predictor_id = u.id
      GROUP BY u.id`;

  return query;
};

export const generate_GET_USER_BET_SUMMARY_with_SEASON = (
  seasonId?: number | string
) => {
  const whereClause = seasonId ? ` AND eb.season_id = ${seasonId}` : "";

  const query = `
    SELECT
        u.id,
        u.discord_id,
        RANK () OVER (
          ORDER BY 
            COUNT(eb.bet_id) FILTER 
              (WHERE 
                ((eb.status = 'successful' AND eb.endorsed IS TRUE) OR
                (eb.status = 'failed' AND eb.endorsed IS FALSE))${whereClause}
              )::INT DESC,
            COUNT(eb.bet_id) FILTER 
              (WHERE 
                ((eb.status = 'successful' AND eb.endorsed IS FALSE) OR
                (eb.status = 'failed' AND eb.endorsed IS TRUE))${whereClause}
              )::INT ASC
        ) as rank,
        COUNT(eb.bet_id) FILTER 
          (WHERE 
            ((eb.status = 'successful' AND eb.endorsed IS TRUE) OR
            (eb.status = 'failed' AND eb.endorsed IS FALSE))${whereClause}
          )::INT as successful,
        COUNT(eb.bet_id) FILTER 
          (WHERE 
            ((eb.status = 'successful' AND eb.endorsed IS FALSE) OR
            (eb.status = 'failed' AND eb.endorsed IS TRUE))${whereClause}
          )::INT as failed,
        COUNT(eb.bet_id) FILTER 
          (WHERE (eb.status = 'open' OR eb.status = 'closed')${whereClause})::INT as pending,
        COUNT(eb.bet_id) FILTER (WHERE eb.status = 'retired')::INT as retired
      FROM users u
      LEFT JOIN enhanced_bets eb ON eb.better_id = u.id
      GROUP BY u.id`;

  return query;
};

export const generate_GET_USER_VOTE_SUMMARY_with_SEASON = (
  seasonId?: number | string
) => {
  const whereClause = seasonId ? ` AND ev.season_id = ${seasonId}` : "";

  const query = `
    SELECT
        u.id,
        COUNT(ev.id) FILTER (WHERE (ev.popular_vote IS TRUE${whereClause}))::INT
          as sycophantic,
        COUNT(ev.id) FILTER (WHERE (ev.popular_vote IS FALSE${whereClause}))::INT
          as contrarian,
        COUNT(ev.id) FILTER (WHERE (ev.status = 'closed'${whereClause}))::INT
          as pending
      FROM users u
      LEFT JOIN enhanced_votes ev ON ev.voter_id = u.id
      GROUP BY u.id`;

  return query;
};

const generate_GET_LEADERBOARD_with_SEASON = (
  type: "points" | "predictions" | "bets",
  seasonId?: string | number
) => {
  const pointsQuery =
    type === "points"
      ? `
        (SELECT jsonb_agg(leaders_sum) FROM (
          WITH 
          users_scores_summary AS 
          (${generate_GET_USER_SCORE_SUMMARY_with_SEASON(seasonId)})
        SELECT
          better_id as id,
          discord_id,
          rank,
          points
        FROM users_scores_summary
        LIMIT 10
        ) leaders_sum ) as leaders`
      : "";

  const predictionsQuery =
    type === "predictions"
      ? `
        (SELECT jsonb_agg(leaders_sum) FROM (
          WITH
          users_predictions_summary AS 
            (${generate_GET_USER_PREDICTION_SUMMARY_with_SEASON(seasonId)})
        SELECT
          id,
          discord_id,
          rank,
          (SELECT 
            row_to_json(pred_sum) 
            FROM (
              SELECT successful, failed, pending, retired
            ) pred_sum
          ) as predictions
        FROM users_predictions_summary
        LIMIT 10
        ) leaders_sum ) as leaders`
      : "";

  const betsQuery =
    type === "bets"
      ? `
        (SELECT jsonb_agg(leaders_sum) FROM (
          WITH
          users_bets_summary 
            AS (${generate_GET_USER_BET_SUMMARY_with_SEASON(seasonId)})
        SELECT
          id,
          discord_id,
          rank,
          (SELECT 
            row_to_json(bet_sum) 
            FROM (
              SELECT successful, failed, pending, retired
            ) bet_sum
          ) as bets
        FROM users_bets_summary
        LIMIT 10
        ) leaders_sum ) as leaders`
      : "";

  const season = seasonId
    ? `(SELECT row_to_json(season_sum) FROM (
        SELECT id, name, start, "end" FROM seasons WHERE seasons.id = ${seasonId}
      ) season_sum) as season,`
    : "";

  return `
    SELECT
      '${type}' as type,
      ${season}
      ${pointsQuery}
      ${predictionsQuery}
      ${betsQuery}
  `;
};

const getLeaderboard =
  (client: PoolClient) =>
  (type: "points" | "predictions" | "bets", seasonId?: string | number) => {
    return client
      .query<APIScores.GetLeaderboard>(
        generate_GET_LEADERBOARD_with_SEASON(type, seasonId)
      )
      .then((response) => response.rows[0]);
  };

export default {
  getLeaderboard,
};
