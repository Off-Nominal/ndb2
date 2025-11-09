import { isValidDriver, PredictionSeed } from "../types.js";
import { resolveSeedDate } from "../utils/dateUtils.js";
import * as API from "@offnominal/ndb2-api-types/v2";

export const INSERT_PREDICTIONS_BULK_SQL = `
  INSERT INTO predictions (
    id,
    user_id,
    text,
    driver,
    created_date,
    due_date,
    check_date
  ) 
  SELECT * FROM UNNEST(
    $1::integer[],
    $2::uuid[],
    $3::text[],
    $4::prediction_driver[],
    $5::timestamp[],
    $6::timestamp[],
    $7::timestamp[]
  ) RETURNING id, created_date
`;

// Bulk SQL for updating prediction dates during lifecycle
export const UPDATE_PREDICTIONS_RETIRED_DATE_BULK_SQL = `
  UPDATE predictions 
  SET retired_date = data_table.retired_date
  FROM (SELECT * FROM UNNEST($1::integer[], $2::timestamp[])) AS data_table(id, retired_date)
  WHERE predictions.id = data_table.id
`;

export const UPDATE_PREDICTIONS_TRIGGERED_DATE_BULK_SQL = `
  UPDATE predictions 
  SET triggered_date = data_table.triggered_date, closed_date = data_table.closed_date, triggerer_id = data_table.triggerer_id
  FROM (SELECT * FROM UNNEST($1::integer[], $2::timestamp[], $3::timestamp[], $4::uuid[])) AS data_table(id, triggered_date, closed_date, triggerer_id)
  WHERE predictions.id = data_table.id
`;

export const UPDATE_PREDICTIONS_JUDGED_DATE_BULK_SQL = `
  UPDATE predictions 
  SET judged_date = data_table.judged_date
  FROM (SELECT * FROM UNNEST($1::integer[], $2::timestamp[])) AS data_table(id, judged_date)
  WHERE predictions.id = data_table.id
`;

export const UPDATE_SNOOZE_CHECKS_CLOSED_DATE_BULK_SQL = `
  UPDATE snooze_checks 
  SET closed = true, closed_at = data_table.closed_at
  FROM (SELECT * FROM UNNEST($1::integer[], $2::timestamp[])) AS data_table(id, closed_at)
  WHERE snooze_checks.id = data_table.id
`;

export interface PredictionInsertData {
  id: number;
  user_id: string;
  text: string;
  created_date: Date;
  due_date: Date;
  driver: API.Entities.Predictions.PredictionDriver;
  check_date: Date | null;
}

export function createPredictionsBulkInsertData(
  predictionSeeds: PredictionSeed[],
  baseDate: Date
): {
  ids: number[];
  user_ids: string[];
  texts: string[];
  created_dates: Date[];
  due_dates: Date[];
  drivers: API.Entities.Predictions.PredictionDriver[];
  check_dates: (Date | null)[];
} {
  const ids: number[] = [];
  const user_ids: string[] = [];
  const texts: string[] = [];
  const created_dates: Date[] = [];
  const due_dates: Date[] = [];
  const drivers: API.Entities.Predictions.PredictionDriver[] = [];
  const check_dates: (Date | null)[] = [];

  for (const pred of predictionSeeds) {
    if (!pred.baseDate) {
      console.error("Base date is undefined for prediction: ", pred.id);
      throw new Error("Base date is undefined");
    }

    const createdDate = resolveSeedDate(pred.baseDate, baseDate);

    ids.push(pred.id);
    user_ids.push(pred.user_id);
    texts.push(pred.text);
    created_dates.push(createdDate);
    due_dates.push(pred.due ? resolveSeedDate(pred.due, createdDate) : null);

    if (!isValidDriver(pred.driver)) {
      throw new Error(`Invalid driver: ${pred.driver}`);
    }
    drivers.push(pred.driver);
    check_dates.push(
      pred.check_date ? resolveSeedDate(pred.check_date, createdDate) : null
    );
  }

  return {
    ids,
    user_ids,
    texts,
    created_dates,
    due_dates,
    drivers,
    check_dates,
  };
}

export function insertPredictionsBulk(
  client: any,
  predictionSeeds: PredictionSeed[],
  baseDate: Date
) {
  const bulkData = createPredictionsBulkInsertData(predictionSeeds, baseDate);

  return client.query(INSERT_PREDICTIONS_BULK_SQL, [
    bulkData.ids,
    bulkData.user_ids,
    bulkData.texts,
    bulkData.drivers,
    bulkData.created_dates,
    bulkData.due_dates,
    bulkData.check_dates,
  ]);
}

// New bulk lifecycle functions
export async function retirePredictionsBulk(
  client: any,
  predictionIds: number[],
  retiredDates: Date[]
) {
  if (predictionIds.length === 0) return;
  return client.query(UPDATE_PREDICTIONS_RETIRED_DATE_BULK_SQL, [
    predictionIds,
    retiredDates,
  ]);
}

export async function triggerPredictionsBulk(
  client: any,
  predictionIds: number[],
  triggeredDates: Date[],
  closedDates: Date[],
  triggerer_id: string[]
) {
  if (predictionIds.length === 0) return;
  return client.query(UPDATE_PREDICTIONS_TRIGGERED_DATE_BULK_SQL, [
    predictionIds,
    triggeredDates,
    closedDates,
    triggerer_id,
  ]);
}

export async function judgePredictionsBulk(
  client: any,
  predictionIds: number[],
  judgedDates: Date[]
) {
  if (predictionIds.length === 0) return;
  return client.query(UPDATE_PREDICTIONS_JUDGED_DATE_BULK_SQL, [
    predictionIds,
    judgedDates,
  ]);
}

export async function closeSnoozeChecksBulk(
  client: any,
  snoozeCheckIds: number[],
  closedDates: Date[]
) {
  if (snoozeCheckIds.length === 0) return;
  return client.query(UPDATE_SNOOZE_CHECKS_CLOSED_DATE_BULK_SQL, [
    snoozeCheckIds,
    closedDates,
  ]);
}
