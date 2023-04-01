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

const CREATE_ENHANCED_BETS_VIEW = `
  CREATE VIEW enhanced_bets AS
    SELECT
      b.id as bet_id,
      b.user_id as better_id,
      b.endorsed,
      (SELECT 
        COALESCE(
          NULLIF(
            EXTRACT(
              DAY FROM
                CASE
                  WHEN p.closed_date IS NOT NULL THEN p.closed_date - b.date
                  ELSE p.due_date - b.date
                END
            ),
            0
          ),
          1
        )
      ) as wager,
      b.prediction_id,
      p.user_id as predictor_id,
      (CASE
        WHEN p.retired_date IS NOT NULL THEN 'retired'
        WHEN p.judged_date IS NOT NULL THEN
          CASE 
            WHEN 
              (SELECT mode() WITHIN GROUP (order by votes.vote) FROM votes WHERE votes.prediction_id = p.id)
                THEN 'successful'
            ELSE 'failed'
          END
        WHEN p.closed_date IS NOT NULL THEN 'closed'
        ELSE 'open'
      END) as status
    FROM bets b
    JOIN predictions p on b.prediction_id = p.id
`;

const CREATE_ENHANCED_PREDICTIONS_VIEW = `
  CREATE VIEW enhanced_predictions AS
    SELECT
      p.id as prediction_id,
      p.user_id as predictor_id,
      (CASE
        WHEN p.retired_date IS NOT NULL THEN 'retired'
        WHEN p.judged_date IS NOT NULL THEN
          CASE 
            WHEN 
              (SELECT mode() WITHIN GROUP (order by votes.vote) FROM votes WHERE votes.prediction_id = p.id)
                THEN 'successful'
            ELSE 'failed'
          END
        WHEN p.closed_date IS NOT NULL THEN 'closed'
        ELSE 'open'
      END) as status,
      (SELECT COUNT(id) FILTER (WHERE b.endorsed) FROM bets b WHERE b.prediction_id = p.id) as endorsements,
      (SELECT COALESCE(
        NULLIF(
          (SELECT SUM(eb.wager) FROM enhanced_bets eb WHERE eb.prediction_id = p.id AND eb.endorsed IS TRUE), 0
          ), 0
        )
      ) as total_endorsement_wagers,
      (SELECT COUNT(id) FILTER (WHERE NOT b.endorsed) FROM bets b WHERE b.prediction_id = p.id) as undorsements,
      (SELECT COALESCE(
        NULLIF(
          (SELECT SUM(eb.wager) FROM enhanced_bets eb WHERE eb.prediction_id = p.id AND eb.endorsed IS FALSE), 0
          ), 0
        )
      ) as total_undorsement_wagers,
      (SELECT SUM(eb.wager) FROM enhanced_bets eb WHERE eb.prediction_id = p.id) as total_wager,
      (SELECT 
        ROUND(
          (
            ( 
              ln(
                (SELECT SUM(eb.wager) FROM enhanced_bets eb WHERE eb.prediction_id = p.id) /
                COALESCE(NULLIF((SELECT SUM(eb.wager) FROM enhanced_bets eb WHERE eb.prediction_id = p.id AND eb.endorsed IS TRUE), 0), 0.5) / 2
              ) / 1.5 
            ) + 1)::numeric,
          2
        )
      ) as endorsement_ratio,
      (SELECT 
        ROUND(
          (
            ( 
              ln(
                (SELECT SUM(eb.wager) FROM enhanced_bets eb WHERE eb.prediction_id = p.id) /
                COALESCE(NULLIF((SELECT SUM(eb.wager) FROM enhanced_bets eb WHERE eb.prediction_id = p.id AND eb.endorsed IS FALSE), 0), 0.5) / 2
              ) / 1.5 
            ) + 1)::numeric,
          2
        )
      ) as undorsement_ratio
    FROM predictions p
    ORDER BY ID
`;

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

const CREATE_BET_PAYOUT_TABLE = `
  CREATE VIEW payouts AS
    SELECT
      eb.bet_id,
      eb.better_id,
      eb.prediction_id,
      eb.predictor_id,
      eb.endorsed,
      eb.status,
      eb.wager,
      ep.endorsement_ratio,
      ep.undorsement_ratio,
      (SELECT 
        COALESCE(
          NULLIF(
            FLOOR(
              eb.wager *
              (CASE
                WHEN eb.status = 'successful'
                THEN ep.endorsement_ratio
                ELSE ep.undorsement_ratio
              END)
            ), 0
          ), 1
        )  *
        (CASE
          WHEN 
            (eb.status = 'successful' AND eb.endorsed IS TRUE) OR 
            (eb.status = 'failed' AND eb.endorsed IS FALSE)
          THEN 1
          ELSE -1
        END)
      ) as payout
    FROM enhanced_bets eb
    JOIN enhanced_predictions ep ON ep.prediction_id = eb.prediction_id
    WHERE eb.status = 'successful' OR eb.status = 'failed'
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
