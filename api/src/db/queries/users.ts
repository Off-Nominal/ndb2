import { APIUsers } from "../../types/users";
import {
  generate_GET_USER_BET_SUMMARY_with_SEASON,
  generate_GET_USER_PREDICTION_SUMMARY_with_SEASON,
  generate_GET_USER_SCORE_SUMMARY_with_SEASON,
  generate_GET_USER_VOTE_SUMMARY_with_SEASON,
} from "./scores";
import { PoolClient } from "pg";
import { seasonsManager } from "../../classes/SeasonManager";
import { APIBets } from "../../types/bets";
import { randomUUID } from "crypto";

const GET_USER_BY_DISCORD_ID = `
  SELECT id, discord_id 
  FROM users
  WHERE discord_id = $1`;

const ADD_USER = `
  INSERT INTO users (id, discord_id) 
  VALUES ($1, $2) 
  RETURNING id, discord_id`;

const GET_BETS_BY_USER_ID = `
  SELECT
    id,
    prediction_id,
    date,
    endorsed,
    wager,
    valid,
    payout,
    season_payout
  FROM bets b
  WHERE b.user_id = $1`;

const generate_GET_USER_SCORE_BY_ID_with_SEASON = (
  userId: number | string,
  seasonId?: number | string
): [string, string[]] => {
  const params = [userId.toString()];

  const hasSelectedSeason = seasonId !== undefined;

  if (hasSelectedSeason) {
    params.push(seasonId.toString());
  }

  const parameterizedSeasonId = "$".concat(params.length.toString());

  const season = seasonId
    ? `
    (SELECT row_to_json(season_sum) FROM (
      SELECT id, name, start, "end" FROM seasons WHERE seasons.id = ${parameterizedSeasonId}
    ) season_sum) as season,
  `
    : "";

  return [
    `
    WITH 
      users_scores_summary 
        AS (${generate_GET_USER_SCORE_SUMMARY_with_SEASON(
          hasSelectedSeason ? parameterizedSeasonId : undefined
        )}),
      users_predictions_summary 
        AS (${generate_GET_USER_PREDICTION_SUMMARY_with_SEASON(
          hasSelectedSeason ? parameterizedSeasonId : undefined
        )}),
      users_bets_summary 
        AS (${generate_GET_USER_BET_SUMMARY_with_SEASON(
          hasSelectedSeason ? parameterizedSeasonId : undefined
        )}),
      users_votes_summary 
        AS (${generate_GET_USER_VOTE_SUMMARY_with_SEASON(
          hasSelectedSeason ? parameterizedSeasonId : undefined
        )})
    SELECT
      ${season}
      (SELECT row_to_json(score_sum) FROM (
        SELECT points, rank FROM users_scores_summary us WHERE us.better_id  = $1
      ) score_sum) as score,
      (SELECT row_to_json(pred_sum) FROM (
        SELECT successful, failed, pending, retired, rank FROM users_predictions_summary WHERE id = $1
      ) pred_sum) as predictions,
      (SELECT row_to_json(bet_sum) FROM (
        SELECT successful, failed, pending, retired, invalid, rank FROM users_bets_summary WHERE id = $1
      ) bet_sum) as bets,
      (SELECT row_to_json(vote_sum) FROM (
        SELECT sycophantic, contrarian, pending FROM users_votes_summary WHERE id = $1
      ) vote_sum) as votes`,
    params,
  ];
};

const add = (client: PoolClient) =>
  function (discordId: number | string): Promise<APIUsers.User> {
    const id = randomUUID();
    return client
      .query<APIUsers.AddUser>(ADD_USER, [id, discordId])
      .then((response) => response.rows[0]);
  };

const getByDiscordId = (client: PoolClient) =>
  function (discordId: number | string): Promise<APIUsers.User> {
    return client
      .query<APIUsers.GetUserByDiscordId>(GET_USER_BY_DISCORD_ID, [discordId])
      .then((response) => response.rows[0]);
  };

const getUserScoreById = (client: PoolClient) =>
  function (
    userId: number | string,
    seasonIdentifier?: "current" | "last" | number
  ): Promise<APIUsers.GetUserScoreByDiscordId> {
    let seasonId: number | undefined = undefined;

    if (seasonIdentifier) {
      if (typeof seasonIdentifier === "number") {
        seasonId = seasonIdentifier;
      } else {
        seasonId = seasonsManager.getSeasonByIdentifier(seasonIdentifier).id;
      }
    }

    const [query, params] = generate_GET_USER_SCORE_BY_ID_with_SEASON(
      userId,
      seasonId
    );

    return client
      .query<APIUsers.GetUserScoreByDiscordId>(query, params)
      .then((response) => response.rows[0]);
  };

const getBetsByUserId = (client: PoolClient) =>
  function (userId: number | string): Promise<Omit<APIBets.Bet, "user_id">[]> {
    return client
      .query<APIUsers.GetBetsByUserId>(GET_BETS_BY_USER_ID, [userId])
      .then((response) => response.rows);
  };

export default {
  add,
  getByDiscordId,
  getUserScoreById,
  getBetsByUserId,
};
