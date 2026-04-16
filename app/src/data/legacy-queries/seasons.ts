import { PoolClient } from "pg";
import { APISeasons } from "../../api/v1/types/seasons";

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

const getAll = (client: PoolClient) =>
  function (): Promise<APISeasons.GetSeasons[]> {
    return client
      .query<APISeasons.GetSeasons>(GET_SEASONS)
      .then((response) => response.rows);
  };

export default {
  getAll,
};
