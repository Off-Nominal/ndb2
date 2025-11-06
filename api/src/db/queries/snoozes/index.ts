import { PoolClient } from "pg";
import { APISnoozes } from "../../../types/snoozes";
import { APIPredictions } from "../../../types/predicitions";
import predictions from "../predictions";
import queries from "../index";

const getSnoozeCheck = (client: PoolClient) =>
  function (
    snooze_check_id: number | string
  ): Promise<APISnoozes.GetSnoozeCheck> {
    return client
      .query<APISnoozes.GetSnoozeCheck>(queries.get("GetSnoozeCheckById"), [
        snooze_check_id,
      ])
      .then((response) => response.rows[0]);
  };

const getNextUnactionedSnoozeCheck = (client: PoolClient) =>
  function (): Promise<APISnoozes.GetNextUnactionedCheck> {
    return client
      .query<APISnoozes.GetNextUnactionedCheck>(
        queries.get("GetNextUnactionedCheck")
      )
      .then((response) => response.rows[0]);
  };

const addCheck = (client: PoolClient) =>
  function (
    prediction_id: number | string
  ): Promise<APISnoozes.AddSnoozeCheck> {
    return client
      .query<APISnoozes.AddSnoozeCheck>(queries.get("InsertSnoozeCheck"), [
        prediction_id,
      ])
      .then((response) => response.rows[0]);
  };

const deferSnoozeCheckById = (client: PoolClient) =>
  async function (
    snooze_check_id: number | string
  ): Promise<APISnoozes.DeferSnoozeCheckById> {
    await client.query("BEGIN");

    return client
      .query<APISnoozes.SnoozeCheck>(queries.get("CloseSnoozeCheckById"), [
        snooze_check_id,
      ])
      .then((response) => {
        const check = response.rows[0];
        return predictions.snoozePredictionById(client)(check.prediction_id, {
          days: 1,
        });
      })
      .then((response) => {
        return client.query("COMMIT").then(() => null);
      })
      .catch(async (err) => {
        await client.query("ROLLBACK");
        throw err;
      });
  };

const addSnoozeVote = (client: PoolClient) =>
  async function (
    check_id: number | string,
    user_id: number | string,
    value: APISnoozes.SnoozeOptions
  ): Promise<APIPredictions.EnhancedPrediction> {
    await client.query("BEGIN");

    const now = new Date();

    // Add Snooze Vote
    try {
      await client.query<APISnoozes.SnoozeVote>(
        queries.get("InsertSnoozeVote"),
        [check_id, user_id, value, now]
      );

      // Validate updated Snooze Check
      let check: APISnoozes.EnhancedSnoozeCheck;

      check = await getSnoozeCheck(client)(check_id);

      const snoozeValue = getClosedSnoozeValue(check);
      const shouldClose = shouldCloseSnoozeCheck(check, snoozeValue);

      // If necessary to close, continue close procedure
      if (shouldClose) {
        if (!snoozeValue) {
          throw new Error("Snooze value is null");
        }
        await client.query<APISnoozes.SnoozeCheck>(
          queries.get("CloseSnoozeCheckById"),
          [check_id]
        );

        await predictions.snoozePredictionById(client)(check.prediction_id, {
          days: snoozeValue,
        });

        check = await getSnoozeCheck(client)(check_id);
      }

      // Get final results
      const finalPrediction = await predictions.getPredictionById(client)(
        check.prediction_id
      );

      if (!finalPrediction) {
        throw new Error("Final prediction not found");
      }

      await client.query("COMMIT");
      return finalPrediction;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  };

const getClosedSnoozeValue = (
  check: APISnoozes.EnhancedSnoozeCheck
): APISnoozes.SnoozeOptions | null => {
  let triggerValue: string | undefined = undefined;

  for (const [key, value] of Object.entries(check.votes)) {
    if (value >= 3) triggerValue = key;
  }

  if (triggerValue !== undefined) {
    switch (triggerValue) {
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
  getNextUnactionedSnoozeCheck,
  deferSnoozeCheckById,
  addCheck,
  addSnoozeVote,
};
