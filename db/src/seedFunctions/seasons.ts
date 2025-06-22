import { SeasonSeed } from "../types";

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

function getQuarterDates(
  baseDate: Date,
  quarter: "last" | "current" | "next"
): { start: Date; end: Date } {
  const currentQuarter = Math.floor(baseDate.getUTCMonth() / 3);
  const currentYear = baseDate.getUTCFullYear();

  let targetQuarter: number;
  let targetYear: number;

  switch (quarter) {
    case "last":
      if (currentQuarter === 0) {
        targetQuarter = 3;
        targetYear = currentYear - 1;
      } else {
        targetQuarter = currentQuarter - 1;
        targetYear = currentYear;
      }
      break;
    case "current":
      targetQuarter = currentQuarter;
      targetYear = currentYear;
      break;
    case "next":
      if (currentQuarter === 3) {
        targetQuarter = 0;
        targetYear = currentYear + 1;
      } else {
        targetQuarter = currentQuarter + 1;
        targetYear = currentYear;
      }
      break;
  }

  const startMonth = targetQuarter * 3;
  const start = new Date(Date.UTC(targetYear, startMonth, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(targetYear, startMonth + 3, 1, 0, 0, 0, 0)); // Start of next quarter (exclusive)

  return { start, end };
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
