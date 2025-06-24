import { SeasonSeed } from "../types";
import { getQuarterDates } from "../utils/dateUtils";

export const INSERT_SEASONS_BULK_SQL = `
  INSERT INTO seasons (
    name, 
    start, 
    "end", 
    payout_formula
  ) 
  SELECT * FROM UNNEST(
    $1::text[],
    $2::timestamp[],
    $3::timestamp[],
    $4::text[]
  )
`;

export interface SeasonInsertData {
  name: string;
  start: string | null;
  end: string | null;
  payout_formula: string;
}

export function createSeasonsBulkInsertData(
  seasonSeeds: SeasonSeed[],
  baseDate: Date
): {
  names: string[];
  starts: (string | null)[];
  ends: (string | null)[];
  payout_formulas: string[];
} {
  return {
    names: seasonSeeds.map((season) => season.name),
    starts: seasonSeeds.map((season) => {
      if ("quarter" in season) {
        const { start } = getQuarterDates(baseDate, season.quarter);
        return start.toISOString();
      }
      return season.start || null;
    }),
    ends: seasonSeeds.map((season) => {
      if ("quarter" in season) {
        const { end } = getQuarterDates(baseDate, season.quarter);
        return end.toISOString();
      }
      return season.end || null;
    }),
    payout_formulas: seasonSeeds.map((season) => season.payout_formula),
  };
}

export function insertSeasonsBulk(
  client: any,
  seasonSeeds: SeasonSeed[],
  baseDate: Date
) {
  const bulkData = createSeasonsBulkInsertData(seasonSeeds, baseDate);
  return client.query(INSERT_SEASONS_BULK_SQL, [
    bulkData.names,
    bulkData.starts,
    bulkData.ends,
    bulkData.payout_formulas,
  ]);
}
