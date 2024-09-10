import { PoolClient } from "pg";
import { APIChecks } from "../types/checks";

const ADD_PREDICTION_CHECK = `
  INSERT INTO checks (
    prediction_id,
    check_date
  ) VALUES (
    $1,
    $2
  ) RETURNING id, prediction_id, check_date, closed, closed_at
`;

const add = (client: PoolClient) =>
  function (
    prediction_id: number | string,
    check_date: string | Date
  ): Promise<APIChecks.AddCheck> {
    return client
      .query<APIChecks.AddCheck>(ADD_PREDICTION_CHECK, [
        prediction_id,
        check_date,
      ])
      .then((response) => response.rows[0]);
  };

export default {
  add,
};
