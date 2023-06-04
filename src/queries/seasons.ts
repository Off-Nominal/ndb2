import { PoolClient } from "pg";
import { APISeasons } from "../types/seasons";

const GET_CURRENT_SEASON = `SELECT 
    id,
    name,
    start,
    "end",
    wager_cap
  FROM seasons WHERE start <= NOW() AND "end" > NOW()`;

const GET_LAST_SEASON = `SELECT 
    id,
    name,
    start,
    "end",
    wager_cap
  FROM seasons WHERE "end" < NOW() ORDER BY "end" DESC LIMIT 1`;

const GET_SEASONS = `
  SELECT
    id,
    name,
    start,
    "end",
    wager_cap,
    (SELECT CASE
        WHEN start <= NOW() AND "end" > NOW() THEN 'current'
        WHEN "end" < NOW() THEN 'past'
        ELSE 'future' 
      END
    ) as identifier
  FROM seasons
  ORDER BY "end" DESC`;

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

export default {
  getAll,
  getSeasonByIdentifier,
};
