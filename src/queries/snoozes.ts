import { PoolClient } from "pg";
import { APISnoozes } from "../types/snoozes";
import webhookManager from "../config/webhook_subscribers";
import { APIPredictions } from "../types/predicitions";
import {
  CLOSE_PREDICTION_BY_ID,
  GET_ENHANCED_PREDICTION_BY_ID,
  SNOOZE_PREDICTION_BY_ID,
} from "./predictions";

const GET_SNOOZE_CHECK = `
  SELECT 
    id, 
    prediction_id, 
    check_date, 
    closed, 
    closed_at,
    (SELECT row_to_json(vals)
      FROM(
        SELECT
          COUNT(sv.*) FILTER (WHERE sv.value = 0) as trigger,
          COUNT(sv.*) FILTER (WHERE sv.value = 1) as day,
          COUNT(sv.*) FILTER (WHERE sv.value = 7) as week,
          COUNT(sv.*) FILTER (WHERE sv.value = 30) as month,
          COUNT(sv.*) FILTER (WHERE sv.value = 90) as quarter,
          COUNT(sv.*) FILTER (WHERE sv.value = 365) as year
        FROM snooze_votes sv
        WHERE sv.snooze_check_id = $1
      ) vals
    ) as votes
  FROM snooze_checks
  WHERE id = $1
`;

const ADD_SNOOZE_CHECK = `
  INSERT INTO snooze_checks (
    prediction_id
  ) VALUES (
    $1
  ) RETURNING id, prediction_id, check_date, closed, closed_at
`;

const CLOSE_SNOOZE_CHECK = `
  UPDATE snooze_checks
  SET closed = true, closed_at = NOW()
  WHERE id = $1
  RETURNING id, prediction_id, check_date, closed, closed_at
`;

const ADD_SNOOZE_VOTE = `
  INSERT INTO snooze_votes (
    snooze_check_id,
    user_id,
    value,
    created_at
  ) VALUES (
    $1,
    $2,
    $3,
    $4
  )   
    ON CONFLICT (snooze_check_id, user_id)
      DO UPDATE SET value = $3, created_at = $4 
    RETURNING snooze_check_id, user_id, value, created_at
`;

const getSnoozeCheck = (client: PoolClient) =>
  function (
    snooze_check_id: number | string
  ): Promise<APISnoozes.GetSnoozeCheck> {
    return client
      .query<APISnoozes.GetSnoozeCheck>(GET_SNOOZE_CHECK, [snooze_check_id])
      .then((response) => response.rows[0]);
  };

const addCheck = (client: PoolClient) =>
  function (
    prediction_id: number | string
  ): Promise<APISnoozes.AddSnoozeCheck> {
    return client
      .query<APISnoozes.AddSnoozeCheck>(ADD_SNOOZE_CHECK, [prediction_id])
      .then((response) => response.rows[0]);
  };

const addVote = (client: PoolClient) =>
  async function (
    check_id: number | string,
    user_id: number | string,
    value: APISnoozes.SnoozeOptions
  ): Promise<APIPredictions.EnhancedPrediction> {
    await client.query("BEGIN");

    const now = new Date();

    // Add Snooze Vote
    await client.query<APISnoozes.SnoozeVote>(ADD_SNOOZE_VOTE, [
      check_id,
      user_id,
      value,
      now,
    ]);

    // Validate updated Snooze Check
    let check: APISnoozes.EnhancedSnoozeCheck;

    check = await client
      .query<APISnoozes.EnhancedSnoozeCheck>(GET_SNOOZE_CHECK, [check_id])
      .then((response) => response.rows[0]);

    const snoozeValue = getClosedSnoozeValue(check);
    const shouldClose = shouldCloseSnoozeCheck(check, snoozeValue);

    // If necessary to close, continue close procedure
    if (shouldClose) {
      await client
        .query<APISnoozes.SnoozeCheck>(CLOSE_SNOOZE_CHECK, [check_id])
        .then((response) => response.rows[0]);

      if (snoozeValue === APISnoozes.SnoozeOptions.TRIGGER) {
        await client.query(CLOSE_PREDICTION_BY_ID, [
          check.prediction_id,
          null,
          now,
        ]);
      } else {
        await client.query(SNOOZE_PREDICTION_BY_ID, [
          check.prediction_id,
          snoozeValue,
        ]);
      }

      check = await client
        .query<APISnoozes.EnhancedSnoozeCheck>(GET_SNOOZE_CHECK, [check_id])
        .then((response) => response.rows[0]);
    }

    // Get final results
    const finalPrediction = await client
      .query<APIPredictions.EnhancedPrediction>(GET_ENHANCED_PREDICTION_BY_ID, [
        check.prediction_id,
      ])
      .then((response) => response.rows[0]);

    await client.query("COMMIT");

    return finalPrediction;
  };

const getClosedSnoozeValue = (
  check: APISnoozes.EnhancedSnoozeCheck
): APISnoozes.SnoozeOptions | null => {
  let triggerValue: string;

  for (const [key, value] of Object.entries(check.votes)) {
    if (value >= 3) triggerValue = key;
  }

  if (triggerValue !== undefined) {
    switch (triggerValue) {
      case "trigger":
        return APISnoozes.SnoozeOptions.TRIGGER;
      case "day":
        return APISnoozes.SnoozeOptions.DAY;
      case "week":
        return APISnoozes.SnoozeOptions.WEEK;
      case "month":
        return APISnoozes.SnoozeOptions.MONTH;
      case "quarter":
        return APISnoozes.SnoozeOptions.QUARTER;
      case "year":
        return APISnoozes.SnoozeOptions.YEAR;
    }
  }

  return null;
};

const shouldCloseSnoozeCheck = (
  check: APISnoozes.EnhancedSnoozeCheck,
  snoozeValue: APISnoozes.SnoozeOptions | null
): boolean => !check.closed && snoozeValue !== null;

export default {
  getSnoozeCheck,
  addCheck,
  addVote,
};
