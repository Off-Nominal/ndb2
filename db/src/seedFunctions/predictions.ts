import { isValidDriver, PredictionSeed } from "../types";
import { resolveSeedDate } from "../utils/dateUtils";
import * as API from "@offnominal/ndb2-api-types";

export const INSERT_PREDICTIONS_BULK_SQL = `
  INSERT INTO predictions (
    id,
    user_id,
    text,
    created_date,
    due_date,
    closed_date,
    retired_date,
    triggered_date,
    judged_date,
    triggerer_id,
    driver,
    check_date
  ) 
  SELECT * FROM UNNEST(
    $1::integer[],
    $2::uuid[],
    $3::text[],
    $4::timestamp[],
    $5::timestamp[],
    $6::timestamp[],
    $7::timestamp[],
    $8::timestamp[],
    $9::timestamp[],
    $10::uuid[],
    $11::prediction_driver[],
    $12::timestamp[]
  ) RETURNING id
`;

export interface PredictionInsertData {
  id: number;
  user_id: string;
  text: string;
  created_date: Date;
  due_date: Date;
  closed_date: Date | null;
  retired_date: Date | null;
  triggered_date: Date | null;
  judged_date: Date | null;
  triggerer_id: string | null;
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
  closed_dates: (Date | null)[];
  retired_dates: (Date | null)[];
  triggered_dates: (Date | null)[];
  judged_dates: (Date | null)[];
  triggerer_ids: (string | null)[];
  drivers: API.Entities.Predictions.PredictionDriver[];
  check_dates: (Date | null)[];
} {
  const ids: number[] = [];
  const user_ids: string[] = [];
  const texts: string[] = [];
  const created_dates: Date[] = [];
  const due_dates: Date[] = [];
  const closed_dates: (Date | null)[] = [];
  const retired_dates: (Date | null)[] = [];
  const triggered_dates: (Date | null)[] = [];
  const judged_dates: (Date | null)[] = [];
  const triggerer_ids: (string | null)[] = [];
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
    closed_dates.push(
      pred.closed ? resolveSeedDate(pred.closed, createdDate) : null
    );
    retired_dates.push(
      pred.retired ? resolveSeedDate(pred.retired, createdDate) : null
    );
    triggered_dates.push(
      pred.triggered ? resolveSeedDate(pred.triggered, createdDate) : null
    );
    judged_dates.push(
      pred.judged ? resolveSeedDate(pred.judged, createdDate) : null
    );
    triggerer_ids.push(pred.triggerer || null);

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
    closed_dates,
    retired_dates,
    triggered_dates,
    judged_dates,
    triggerer_ids,
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
    bulkData.created_dates,
    bulkData.due_dates,
    bulkData.closed_dates,
    bulkData.retired_dates,
    bulkData.triggered_dates,
    bulkData.judged_dates,
    bulkData.triggerer_ids,
    bulkData.drivers,
    bulkData.check_dates,
  ]);
}
