import { PoolClient } from "pg";
import { APISeasons } from "../types/seasons";

const GET_CURRENT_SEASON = `SELECT * FROM seasons WHERE start <= NOW() AND "end" > NOW()`;
const GET_LAST_SEASON = `SELECT * FROM seasons WHERE "end" < NOW() ORDER BY "end" DESC LIMIT 1`;

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
  getSeasonByIdentifier,
};
