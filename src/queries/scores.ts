import { PoolClient, QueryResult } from "pg";
import { APIScores } from "../types/scores";
import { seasonManager } from "../classes/SeasonManager";

export const generate_GET_USER_SCORE_SUMMARY_with_SEASON = (
  parameterizedSeasonId?: string
) => {
  const seasonFilter = parameterizedSeasonId
    ? ` FILTER (WHERE p.season_id = ${parameterizedSeasonId})`
    : "";

  const query = `
    SELECT
        u.id as better_id,
        u.discord_id,
        COALESCE(SUM(bets.${
          parameterizedSeasonId ? "season_" : ""
        }payout)${seasonFilter}, 0) as points,
        RANK () OVER (
          ORDER BY 
            COALESCE(SUM(bets.${
              parameterizedSeasonId ? "season_" : ""
            }payout)${seasonFilter}, 0) DESC
        )
      FROM users u
      LEFT JOIN bets ON bets.user_id = u.id
      LEFT JOIN predictions p ON p.id = bets.prediction_id
      GROUP BY u.id`;

  return query;
};

export const generate_GET_USER_PREDICTION_SUMMARY_with_SEASON = (
  parameterizedSeasonId?: string
) => {
  const whereClause = parameterizedSeasonId
    ? ` AND p.season_id = ${parameterizedSeasonId}`
    : "";

  const query = `
    SELECT
        u.id,
        u.discord_id,
        RANK () OVER (
          ORDER BY 
            COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'successful'${whereClause})::INT DESC,
            COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'failed'${whereClause})::INT ASC
        ) as rank,
        COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'successful'${whereClause})::INT
          as successful,
        COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'failed'${whereClause})::INT
          as failed,
        COUNT(DISTINCT p.id) FILTER (WHERE (p.status = 'open' OR p.status = 'closed')${whereClause})::INT
          as pending,
        COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'retired'${whereClause})::INT
          as retired
      FROM users u
      LEFT JOIN predictions p ON p.user_id = u.id
      GROUP BY u.id`;

  return query;
};

export const generate_GET_USER_BET_SUMMARY_with_SEASON = (
  parameterizedSeasonId?: string
) => {
  const whereClause = parameterizedSeasonId
    ? ` AND p.season_id = ${parameterizedSeasonId}`
    : "";

  const query = `
    SELECT
        u.id,
        u.discord_id,
        RANK () OVER (
          ORDER BY 
            COUNT(b.id) FILTER 
              (WHERE 
                ((p.status = 'successful' AND b.endorsed IS TRUE) OR
                (p.status = 'failed' AND b.endorsed IS FALSE))${whereClause}
              )::INT DESC,
            COUNT(b.id) FILTER 
              (WHERE 
                ((p.status = 'successful' AND b.endorsed IS FALSE) OR
                (p.status = 'failed' AND b.endorsed IS TRUE))${whereClause}
              )::INT ASC
        ) as rank,
        COUNT(b.id) FILTER 
          (WHERE 
            ( (
                (p.status = 'successful' AND b.endorsed IS TRUE) OR
                (p.status = 'failed' AND b.endorsed IS FALSE)
              ) AND b.valid IS TRUE
            )${whereClause}
          )::INT as successful,
        COUNT(b.id) FILTER 
          (WHERE 
            ( (
                (p.status = 'successful' AND b.endorsed IS FALSE) OR
                (p.status = 'failed' AND b.endorsed IS TRUE)
              ) AND b.valid IS TRUE
            )${whereClause}
          )::INT as failed,
        COUNT(b.id) FILTER 
          (WHERE (p.status = 'open' OR p.status = 'closed') AND b.valid IS TRUE${whereClause})::INT as pending,
        COUNT(b.id) FILTER (WHERE p.status = 'retired'${whereClause})::INT as retired,
        COUNT(b.id) FILTER (WHERE b.valid IS FALSE${whereClause})::INT as invalid
      FROM users u
      LEFT JOIN bets b ON b.user_id = u.id
      LEFT JOIN predictions p ON b.prediction_id = p.id
      GROUP BY u.id`;

  return query;
};

export const generate_GET_USER_VOTE_SUMMARY_with_SEASON = (
  parameterizedSeasonId?: string
) => {
  const whereClause = parameterizedSeasonId
    ? ` AND ev.season_id = ${parameterizedSeasonId}`
    : "";

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
): [string, string[]] => {
  const params = [];

  if (seasonId) {
    params.push(seasonId);
  }

  const parameterizedSeasonId = "$".concat(params.length.toString());

  const pointsQuery =
    type === "points"
      ? `
        (SELECT jsonb_agg(leaders_sum) FROM (
          WITH 
          users_scores_summary AS 
          (${generate_GET_USER_SCORE_SUMMARY_with_SEASON(
            seasonId && parameterizedSeasonId
          )})
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
            (${generate_GET_USER_PREDICTION_SUMMARY_with_SEASON(
              seasonId && parameterizedSeasonId
            )})
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
            AS (${generate_GET_USER_BET_SUMMARY_with_SEASON(
              seasonId && parameterizedSeasonId
            )})
        SELECT
          id,
          discord_id,
          rank,
          (SELECT 
            row_to_json(bet_sum) 
            FROM (
              SELECT successful, failed, pending, retired, invalid
            ) bet_sum
          ) as bets
        FROM users_bets_summary
        LIMIT 10
        ) leaders_sum ) as leaders`
      : "";

  const season = seasonId
    ? `(SELECT row_to_json(season_sum) FROM (
        SELECT id, name, start, "end" FROM seasons WHERE seasons.id = ${parameterizedSeasonId}
      ) season_sum) as season,`
    : "";

  return [
    `
    SELECT
      '${type}' as type,
      ${season}
      ${pointsQuery}
      ${predictionsQuery}
      ${betsQuery}
  `,
    params,
  ];
};

const getLeaderboard =
  (client: PoolClient) =>
  (
    type: "points" | "predictions" | "bets",
    seasonIdentifier?: "current" | "last" | number
  ) => {
    let seasonId: number;

    if (seasonIdentifier) {
      if (typeof seasonIdentifier === "number") {
        seasonId = seasonIdentifier;
      } else {
        seasonId = seasonManager.getSeasonByIdentifier(seasonIdentifier).id;
      }
    }

    let query: Promise<
      QueryResult<
        | APIScores.GetPointsLeaderboard
        | APIScores.GetPredictionsLeaderboard
        | APIScores.GetBetsLeaderboard
      >
    >;

    if (type === "points") {
      const [parameterizedQuery, params] = generate_GET_LEADERBOARD_with_SEASON(
        type,
        seasonId
      );
      query = client.query<APIScores.GetPointsLeaderboard>(
        parameterizedQuery,
        params
      );
    }
    if (type === "predictions") {
      const [parameterizedQuery, params] = generate_GET_LEADERBOARD_with_SEASON(
        type,
        seasonId
      );
      query = client.query<APIScores.GetPredictionsLeaderboard>(
        parameterizedQuery,
        params
      );
    }
    if (type === "bets") {
      const [parameterizedQuery, params] = generate_GET_LEADERBOARD_with_SEASON(
        type,
        seasonId
      );
      query = client.query<APIScores.GetBetsLeaderboard>(
        parameterizedQuery,
        params
      );
    }

    return query.then((response) => response.rows[0]);
  };

export default {
  getLeaderboard,
};
