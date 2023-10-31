import { PoolClient } from "pg";
import { APISeasons } from "../types/seasons";

const GET_CURRENT_SEASON = `SELECT 
    id,
    name,
    start,
    "end",
    wager_cap
    closed,
  FROM seasons WHERE start < NOW() AND "end" >= NOW()`;

const GET_LAST_SEASON = `SELECT 
    id,
    name,
    start,
    "end",
    wager_cap
    closed,
  FROM seasons WHERE "end" < NOW() ORDER BY "end" DESC LIMIT 1`;

const GET_SEASONS = `
  SELECT
    id,
    name,
    start,
    "end",
    wager_cap,
    closed,
    (SELECT CASE
        WHEN start < NOW() AND "end" >= NOW() THEN 'current'
        WHEN "end" < NOW() THEN 'past'
        ELSE 'future' 
      END
    ) as identifier
  FROM seasons
  ORDER BY "end" DESC`;

const CLOSE_SEASON_BY_ID = `
  UPDATE seasons
  SET closed = TRUE
  WHERE id = $1
  RETURNING id
`;

const GET_RESULTS_BY_SEASON_ID = `
  SELECT
    (SELECT row_to_json(s) FROM (
      SELECT 
        id,
        name,
        start,
        "end",
        wager_cap,
        closed
      FROM seasons WHERE id = $1
    ) s ) as season,
    (SELECT row_to_json(p) FROM (
      SELECT
        COUNT(*) FILTER (WHERE closed_date IS NOT NULL) as closed,
        COUNT(*) FILTER (WHERE status = 'successful') as successes,
        COUNT(*) FILTER (WHERE status = 'failed') as failures
      FROM predictions
      WHERE season_id = $1
    ) p ) as predictions,
    (SELECT row_to_json(b) FROM (
      SELECT
        COUNT(bets.*) FILTER (WHERE predictions.closed_date IS NOT NULL) as closed,
        COUNT(bets.*) FILTER (WHERE bets.season_payout IS NOT NULL AND bets.season_payout > 0) as successes,
        COUNT(bets.*) FILTER (WHERE bets.season_payout IS NOT NULL AND bets.season_payout < 0) as failures
      FROM bets
      JOIN predictions ON predictions.id = bets.prediction_id
      WHERE predictions.season_id = $1 AND bets.valid IS TRUE
    ) b ) as bets,
    (SELECT row_to_json(s) FROM (
      SELECT
        SUM(bets.season_payout) FILTER (WHERE bets.season_payout IS NOT NULL AND bets.season_payout > 0) as payouts,
        SUM(bets.season_payout) FILTER (WHERE bets.season_payout IS NOT NULL AND bets.season_payout < 0) as penalties
      FROM bets
      JOIN predictions ON predictions.id = bets.prediction_id
      WHERE predictions.season_id = $1 AND bets.valid IS TRUE
    ) s ) as scores,
    (SELECT row_to_json(lpay) FROM (
      SELECT
        bets.season_payout as value,
        predictions.id as prediction_id,
        (SELECT row_to_json(better) FROM (
          SELECT
            id,
            discord_id
          FROM users
          WHERE users.id = bets.user_id
        ) better ) as better
      FROM bets
      JOIN predictions ON predictions.id = bets.prediction_id
      WHERE predictions.season_id = $1 AND bets.valid IS TRUE AND bets.season_payout IS NOT NULL
      ORDER BY bets.season_payout DESC
      LIMIT 1
    ) lpay ) as largest_payout,
    (SELECT row_to_json(lpen) FROM (
      SELECT
        bets.season_payout as value,
        predictions.id as prediction_id,
        (SELECT row_to_json(better) FROM (
          SELECT
            id,
            discord_id
          FROM users
          WHERE users.id = bets.user_id
        ) better ) as better
      FROM bets
      JOIN predictions ON predictions.id = bets.prediction_id
      WHERE predictions.season_id = $1 AND bets.valid IS TRUE AND bets.season_payout IS NOT NULL
      ORDER BY bets.season_payout ASC
      LIMIT 1
    ) lpen ) as largest_penalty
`;

const getAll = (client: PoolClient) =>
  function (): Promise<APISeasons.GetSeasons[]> {
    return client
      .query<APISeasons.GetSeasons>(GET_SEASONS)
      .then((response) => response.rows);
  };

const getSeasonByIdentifier = (client: PoolClient) =>
  function (
    identifier: "current" | "last"
  ): Promise<APISeasons.GetSeasonByIdentifier> {
    const query =
      identifier === "current" ? GET_CURRENT_SEASON : GET_LAST_SEASON;

    return client
      .query<APISeasons.GetSeasonByIdentifier>(query)
      .then((response) => response.rows[0]);
  };

const getResultsBySeasonId = (client: PoolClient) =>
  function (id: number | string): Promise<APISeasons.GetResultsBySeasonId> {
    return client
      .query<APISeasons.GetResultsBySeasonId>(GET_RESULTS_BY_SEASON_ID, [id])
      .then((response) => response.rows[0]);
  };

const closeSeasonById = (client: PoolClient) =>
  function (id: number | string): Promise<APISeasons.CloseSeasonById> {
    return client
      .query<APISeasons.CloseSeasonById>(CLOSE_SEASON_BY_ID, [id])
      .then((response) => response.rows[0]);
  };

export default {
  getAll,
  getSeasonByIdentifier,
  getResultsBySeasonId,
  closeSeasonById,
};
