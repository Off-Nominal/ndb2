import pool from "../db";
import { APIUsers } from "../types/users";
import { v4 as uuidv4 } from "uuid";

const GET_USER_BY_DISCORD_ID = `
  SELECT id, discord_id 
  FROM users
  WHERE discord_id = $1`;

const ADD_USER = `
  INSERT INTO users (id, discord_id) 
  VALUES ($1, $2) 
  RETURNING id, discord_id`;

//x

const CREATE_USERS_BETS_SUMMARY = `
  CREATE VIEW users_bets_summary AS
    SELECT
      u.id,
      RANK () OVER (
        ORDER BY 
          COUNT(eb.bet_id) FILTER 
            (WHERE 
              (eb.status = 'successful' AND eb.endorsed IS TRUE) OR
              (eb.status = 'failed' AND eb.endorsed IS FALSE)
            )::INT DESC,
          COUNT(eb.bet_id) FILTER 
            (WHERE 
              (eb.status = 'successful' AND eb.endorsed IS FALSE) OR
              (eb.status = 'failed' AND eb.endorsed IS TRUE)
            )::INT ASC
      ) as rank,
      COUNT(eb.bet_id) FILTER 
        (WHERE 
          (eb.status = 'successful' AND eb.endorsed IS TRUE) OR
          (eb.status = 'failed' AND eb.endorsed IS FALSE)
        )::INT as successful,
      COUNT(eb.bet_id) FILTER 
        (WHERE 
          (eb.status = 'successful' AND eb.endorsed IS FALSE) OR
          (eb.status = 'failed' AND eb.endorsed IS TRUE)
        )::INT as failed,
      COUNT(eb.bet_id) FILTER 
        (WHERE eb.status = 'open' OR eb.status = 'closed')::INT as pending,
      COUNT(eb.bet_id) FILTER (WHERE eb.status = 'retired')::INT as retired
    FROM users u
    LEFT JOIN enhanced_bets eb ON eb.better_id = u.id
    GROUP BY u.id
`;

const CREATE_USERS_PREDICTIONS_SUMMARY = `
  CREATE VIEW users_predictions_summary AS
    SELECT
      u.id,
      RANK () OVER (
        ORDER BY 
          COUNT(DISTINCT ep.prediction_id) FILTER (WHERE ep.status = 'successful')::INT DESC,
          COUNT(DISTINCT ep.prediction_id) FILTER (WHERE ep.status = 'failed')::INT ASC
      ) as rank,
      COUNT(DISTINCT ep.prediction_id) FILTER (WHERE ep.status = 'successful')::INT
        as successful,
      COUNT(DISTINCT ep.prediction_id) FILTER (WHERE ep.status = 'failed')::INT
        as failed,
      COUNT(DISTINCT ep.prediction_id) FILTER (WHERE ep.status = 'open' OR ep.status = 'closed')::INT
        as pending,
      COUNT(DISTINCT ep.prediction_id) FILTER (WHERE ep.status = 'retired')::INT
        as retired
    FROM users u
    LEFT JOIN enhanced_predictions ep ON ep.predictor_id = u.id
    GROUP BY u.id
`;

const CREATE_USERS_SCORE_SUMMARY = `
  CREATE VIEW users_scores_summary AS
    SELECT
      users.id as better_id,
      COALESCE(SUM(payout), 0) as points,
      RANK () OVER (
        ORDER BY 
          COALESCE(SUM(payout), 0) DESC
      )
    FROM users
    LEFT JOIN payouts ON payouts.better_id = users.id
    GROUP BY users.id
`;

const GET_USER_SCORE_BY_ID = `
    SELECT
      (SELECT row_to_json(score_sum) FROM (
        SELECT points, rank FROM users_scores_summary us WHERE us.better_id  = $1
      ) score_sum) as score,
      (SELECT row_to_json(pred_sum) FROM (
        SELECT successful, failed, pending, retired, rank FROM users_predictions_summary WHERE id = $1
      ) pred_sum) as predictions,
      (SELECT row_to_json(bet_sum) FROM (
        SELECT successful, failed, pending, retired, rank FROM users_bets_summary WHERE id = $1
      ) bet_sum) as bets,
      (SELECT COUNT(votes.id) FILTER (WHERE votes.user_id = $1)::INT FROM votes) as votes
`;

export default {
  getOrAddByDiscordId: async function (
    discordId: number | string
  ): Promise<APIUsers.User> {
    return this.getByDiscordId(discordId).then(
      (user) => user || this.add(discordId)
    );
  },

  getByDiscordId: function (
    discordId: number | string
  ): Promise<APIUsers.User> {
    return pool.connect().then((client) => {
      return client
        .query<APIUsers.GetUserByDiscordId>(GET_USER_BY_DISCORD_ID, [discordId])
        .then((response) => {
          client.release();
          return response.rows[0];
        });
    });
  },

  add: function (discordId: number | string): Promise<APIUsers.User> {
    return pool.connect().then((client) => {
      const id = uuidv4();
      return client
        .query<APIUsers.AddUser>(ADD_USER, [id, discordId])
        .then((response) => {
          client.release();
          return response.rows[0];
        });
    });
  },

  getUserAllTimeScoreByDiscordId: async function (
    discordId: number | string
  ): Promise<APIUsers.GetUserAllTimeScoreByDiscordId> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query<APIUsers.GetUserByDiscordId>(
        GET_USER_BY_DISCORD_ID,
        [discordId]
      );
      const userId = rows[0].id;

      const response = await client.query(GET_USER_SCORE_BY_ID, [userId]);

      await client.query("COMMIT");
      return response.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
};
