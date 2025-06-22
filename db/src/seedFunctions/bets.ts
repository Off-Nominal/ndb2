import { BetSeed } from "../types";
import { add } from "date-fns";

export const INSERT_BETS_BULK_SQL = `
  INSERT INTO bets (
    user_id,
    prediction_id,
    endorsed,
    date
  ) 
  SELECT * FROM UNNEST(
    $1::uuid[],
    $2::integer[],
    $3::boolean[],
    $4::timestamp[]
  )
`;

export interface BetInsertData {
  user_id: string;
  prediction_id: number;
  endorsed: boolean;
  date: Date;
}

export function createBetsBulkInsertData(
  betSeeds: BetSeed[],
  predictionIds: number[],
  baseDate: Date
): {
  user_ids: string[];
  prediction_ids: number[];
  endorseds: boolean[];
  dates: Date[];
} {
  return {
    user_ids: betSeeds.map((bet) => bet.user_id),
    prediction_ids: predictionIds,
    endorseds: betSeeds.map((bet) => bet.endorsed),
    dates: betSeeds.map((bet) => add(baseDate, { hours: bet.created })),
  };
}

export function insertBetsBulk(
  client: any,
  betSeeds: BetSeed[],
  predictionIds: number[],
  baseDate: Date
) {
  const bulkData = createBetsBulkInsertData(betSeeds, predictionIds, baseDate);
  return client.query(INSERT_BETS_BULK_SQL, [
    bulkData.user_ids,
    bulkData.prediction_ids,
    bulkData.endorseds,
    bulkData.dates,
  ]);
}
