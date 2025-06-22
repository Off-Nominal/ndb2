import { PredictionSeed } from "../types";
import { add } from "date-fns";

export const INSERT_PREDICTIONS_BULK_SQL = `
  INSERT INTO predictions (
    user_id,
    text,
    created_date,
    due_date,
    closed_date,
    retired_date,
    triggered_date,
    judged_date,
    triggerer_id
  ) 
  SELECT * FROM UNNEST(
    $1::uuid[],
    $2::text[],
    $3::timestamp[],
    $4::timestamp[],
    $5::timestamp[],
    $6::timestamp[],
    $7::timestamp[],
    $8::timestamp[],
    $9::uuid[]
  ) RETURNING id
`;

export interface PredictionInsertData {
  user_id: string;
  text: string;
  created_date: Date;
  due_date: Date;
  closed_date: Date | null;
  retired_date: Date | null;
  triggered_date: Date | null;
  judged_date: Date | null;
  triggerer_id: string | null;
}

export function createPredictionsBulkInsertData(
  predictionSeeds: PredictionSeed[],
  baseDate: Date
): {
  user_ids: string[];
  texts: string[];
  created_dates: Date[];
  due_dates: Date[];
  closed_dates: (Date | null)[];
  retired_dates: (Date | null)[];
  triggered_dates: (Date | null)[];
  judged_dates: (Date | null)[];
  triggerer_ids: (string | null)[];
} {
  return {
    user_ids: predictionSeeds.map((pred) => pred.user_id),
    texts: predictionSeeds.map((pred) => pred.text),
    created_dates: predictionSeeds.map((pred) =>
      add(baseDate, { hours: pred.created })
    ),
    due_dates: predictionSeeds.map((pred) =>
      add(baseDate, { hours: pred.due })
    ),
    closed_dates: predictionSeeds.map((pred) =>
      pred.closed ? add(baseDate, { hours: pred.closed }) : null
    ),
    retired_dates: predictionSeeds.map((pred) =>
      pred.retired ? add(baseDate, { hours: pred.retired }) : null
    ),
    triggered_dates: predictionSeeds.map((pred) =>
      pred.triggered ? add(baseDate, { hours: pred.triggered }) : null
    ),
    judged_dates: predictionSeeds.map((pred) =>
      pred.judged ? add(baseDate, { hours: pred.judged }) : null
    ),
    triggerer_ids: predictionSeeds.map((pred) => pred.triggerer || null),
  };
}

export function insertPredictionsBulk(
  client: any,
  predictionSeeds: PredictionSeed[],
  baseDate: Date
) {
  const bulkData = createPredictionsBulkInsertData(predictionSeeds, baseDate);
  return client.query(INSERT_PREDICTIONS_BULK_SQL, [
    bulkData.user_ids,
    bulkData.texts,
    bulkData.created_dates,
    bulkData.due_dates,
    bulkData.closed_dates,
    bulkData.retired_dates,
    bulkData.triggered_dates,
    bulkData.judged_dates,
    bulkData.triggerer_ids,
  ]);
}
