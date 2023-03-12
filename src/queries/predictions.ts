import client from "../db";
import { APIPredictions } from "../types/predicitions";

const ADD_PREDICTION = `
  INSERT INTO predictions (
    user_id,
    text,
    due_date,
    created_date
  ) VALUES (
    $1,
    $2,
    $3,
    $4
  ) RETURNING id, user_id, text, created_date, due_date, closed_date, judged_date, successful
`;

export default {
  add: (
    user_id: string,
    text: string,
    due_date: Date,
    created_date: Date = new Date()
  ) => {
    return client
      .query<APIPredictions.AddPrediction>(ADD_PREDICTION, [
        user_id,
        text,
        due_date,
        created_date,
      ])
      .then((response) => response.rows[0]);
  },
};
