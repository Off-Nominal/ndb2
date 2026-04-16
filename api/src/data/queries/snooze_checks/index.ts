import { PoolClient } from "pg";
import {
  closeSnoozeCheckById,
  getNextUnactionedSnoozeCheck,
  insertSnoozeCheck,
} from "./snooze_checks.queries";
import { extendPredictionCheckDateBySnoozeDays } from "../predictions/predictions.queries";

export default {
  createForPrediction: (dbClient: PoolClient) => async (prediction_id: number) => {
    await insertSnoozeCheck.run({ prediction_id }, dbClient);
    return null;
  },
  getNextUnactioned: (dbClient: PoolClient) => async () => {
    const [row] = await getNextUnactionedSnoozeCheck.run(undefined, dbClient);
    return row;
  },
  deferById: (dbClient: PoolClient) => async (snooze_check_id: number, days: number) => {
    try {
      await dbClient.query("BEGIN");
      const [check] = await closeSnoozeCheckById.run({ snooze_check_id }, dbClient);
      if (!check) {
        throw new Error("Snooze check not found");
      }
      const predictionId = check.prediction_id;
      if (predictionId == null) {
        throw new Error("Snooze check missing prediction_id");
      }
      await extendPredictionCheckDateBySnoozeDays.run(
        { prediction_id: predictionId, days },
        dbClient,
      );
      await dbClient.query("COMMIT");
    } catch (err) {
      await dbClient.query("ROLLBACK");
      throw err;
    }
    return null;
  },
};

