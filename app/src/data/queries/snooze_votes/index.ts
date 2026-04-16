import { PoolClient } from "pg";
import { closeSnoozeCheckById } from "../snooze_checks/snooze_checks.queries";
import { extendPredictionCheckDateBySnoozeDays } from "../predictions/predictions.queries";
import {
  getSnoozeCheckVoteTallies,
  insertSnoozeVote,
  type Json,
} from "./snooze_votes.queries";
import * as NDBTypes from "@offnominal/ndb2-api-types/v2";

type VoteTallies = {
  day: number;
  week: number;
  month: number;
  quarter: number;
  year: number;
};

function parseVoteTallies(values: Json | null): VoteTallies | null {
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    return null;
  }
  const v = values as Record<string, Json>;
  return {
    day: Number(v.day ?? 0),
    week: Number(v.week ?? 0),
    month: Number(v.month ?? 0),
    quarter: Number(v.quarter ?? 0),
    year: Number(v.year ?? 0),
  };
}

function getClosedSnoozeValue(
  tallies: VoteTallies | null,
): NDBTypes.Entities.SnoozeVotes.SnoozeVoteValue | null {
  if (!tallies) {
    return null;
  }

  let triggerKey: string | undefined;

  for (const [key, value] of Object.entries(tallies)) {
    if (value >= 3) {
      triggerKey = key;
    }
  }

  if (triggerKey !== undefined) {
    switch (triggerKey) {
      case "day":
        return 1;
      case "week":
        return 7;
      case "month":
        return 30;
      case "quarter":
        return 90;
      case "year":
        return 365;
      default:
        return null;
    }
  }

  return null;
}

export default {
  addVote:
    (dbClient: PoolClient) =>
    async (
      snooze_check_id: number,
      user_id: string,
      value: NDBTypes.Entities.SnoozeVotes.SnoozeVoteValue,
    ) => {
      const now = new Date();

      try {
        await dbClient.query("BEGIN");

        await insertSnoozeVote.run(
          {
            snooze_check_id,
            user_id,
            value,
            created_at: now,
          },
          dbClient,
        );

        const [checkRow] = await getSnoozeCheckVoteTallies.run(
          { snooze_check_id },
          dbClient,
        );

        if (!checkRow) {
          throw new Error("Snooze check not found after vote");
        }

        const tallies = parseVoteTallies(checkRow.values);
        const snoozeValue = getClosedSnoozeValue(tallies);
        const shouldClose = !checkRow.closed && snoozeValue != null;

        if (shouldClose) {
          await closeSnoozeCheckById.run({ snooze_check_id }, dbClient);

          const predictionId = checkRow.prediction_id;
          if (predictionId == null) {
            throw new Error("Snooze check missing prediction_id");
          }

          await extendPredictionCheckDateBySnoozeDays.run(
            { prediction_id: predictionId, days: snoozeValue },
            dbClient,
          );
        }

        await dbClient.query("COMMIT");
      } catch (err) {
        await dbClient.query("ROLLBACK");
        throw err;
      }
    },
};
