import { PredictionSeed, SnoozeCheckSeed, SnoozeVoteSeed } from "../types";
import { resolveSeedDate } from "../utils/dateUtils";

export const INSERT_SNOOZE_CHECKS_BULK_SQL = `
  INSERT INTO snooze_checks (
    prediction_id,
    check_date,
    closed,
    closed_at
  ) 
  SELECT * FROM UNNEST(
    $1::integer[],
    $2::timestamp[],
    $3::boolean[],
    $4::timestamp[]
  ) RETURNING id, prediction_id
`;

export const INSERT_SNOOZE_VOTES_BULK_SQL = `
  INSERT INTO snooze_votes (
    snooze_check_id,
    user_id,
    value,
    created_at
  ) 
  SELECT * FROM UNNEST(
    $1::integer[],
    $2::uuid[],
    $3::smallint[],
    $4::timestamp[]
  )
`;

export interface SnoozeCheckInsertData {
  prediction_id: number;
  check_date: Date;
  closed: boolean;
  closed_at: Date | null;
}

export interface SnoozeVoteInsertData {
  snooze_check_id: number;
  user_id: string;
  value: number;
  created_at: Date;
}

export function createSnoozeChecksBulkInsertData(
  snoozeCheckSeeds: SnoozeCheckSeed[],
  predictionIds: number[],
  baseDate: Date
): {
  prediction_ids: number[];
  check_dates: Date[];
  closed: boolean[];
  closed_ats: (Date | null)[];
} {
  const check_dates: Date[] = [];
  const closed: boolean[] = [];
  const closed_ats: (Date | null)[] = [];

  for (const check of snoozeCheckSeeds) {
    check_dates.push(resolveSeedDate(check.checked, baseDate));
    closed.push(!!check.closed);
    closed_ats.push(
      check.closed ? resolveSeedDate(check.closed, baseDate) : null
    );
  }

  return {
    prediction_ids: predictionIds,
    check_dates,
    closed,
    closed_ats,
  };
}

export function createSnoozeVotesBulkInsertData(
  snoozeVoteSeeds: SnoozeVoteSeed[],
  snoozeCheckIds: number[],
  baseDate: Date
): {
  snooze_check_ids: number[];
  user_ids: string[];
  values: number[];
  created_ats: Date[];
} {
  const user_ids: string[] = [];
  const values: number[] = [];
  const created_ats: Date[] = [];

  for (let i = 0; i < snoozeVoteSeeds.length; i++) {
    const vote = snoozeVoteSeeds[i];
    user_ids.push(vote.user_id);
    values.push(vote.value);
    created_ats.push(resolveSeedDate(vote.created, baseDate));
  }

  return {
    snooze_check_ids: snoozeCheckIds,
    user_ids,
    values,
    created_ats,
  };
}

export function insertSnoozeChecksBulk(
  client: any,
  snoozeCheckSeeds: SnoozeCheckSeed[],
  predictionIds: number[],
  baseDate: Date
) {
  const bulkData = createSnoozeChecksBulkInsertData(
    snoozeCheckSeeds,
    predictionIds,
    baseDate
  );
  return client.query(INSERT_SNOOZE_CHECKS_BULK_SQL, [
    bulkData.prediction_ids,
    bulkData.check_dates,
    bulkData.closed,
    bulkData.closed_ats,
  ]);
}

export function insertSnoozeVotesBulk(
  client: any,
  snoozeVoteSeeds: SnoozeVoteSeed[],
  snoozeCheckIds: number[],
  baseDate: Date
) {
  const bulkData = createSnoozeVotesBulkInsertData(
    snoozeVoteSeeds,
    snoozeCheckIds,
    baseDate
  );
  return client.query(INSERT_SNOOZE_VOTES_BULK_SQL, [
    bulkData.snooze_check_ids,
    bulkData.user_ids,
    bulkData.values,
    bulkData.created_ats,
  ]);
}

export function insertSnoozeChecksFromPredictions(
  client: any,
  predictionSeeds: PredictionSeed[],
  baseDate: Date
) {
  // Extract all snooze checks from predictions
  const allSnoozeChecks: SnoozeCheckSeed[] = [];
  const allSnoozeVotes: SnoozeVoteSeed[] = [];
  const snoozeCheckToVotesMap: Map<number, SnoozeVoteSeed[]> = new Map();
  const predictionIds: number[] = [];

  for (const prediction of predictionSeeds) {
    if (prediction.checks && Array.isArray(prediction.checks)) {
      for (const check of prediction.checks) {
        // Create snooze check without prediction_id (it will be passed separately)
        const snoozeCheck: SnoozeCheckSeed = {
          checked: check.checked,
          closed: check.closed,
          votes: check.votes,
        };

        allSnoozeChecks.push(snoozeCheck);
        predictionIds.push(prediction.id);

        // Store votes for later insertion
        if (check.votes && Array.isArray(check.votes)) {
          snoozeCheckToVotesMap.set(allSnoozeChecks.length - 1, check.votes);
        }
      }
    }
  }

  if (allSnoozeChecks.length === 0) {
    return Promise.resolve();
  }

  // Insert snooze checks and get their IDs
  return insertSnoozeChecksBulk(
    client,
    allSnoozeChecks,
    predictionIds,
    baseDate
  ).then((result: any) => {
    const snoozeCheckIds = result.rows.map((row: any) => row.id);

    // Prepare votes for bulk insertion
    const votesToInsert: SnoozeVoteSeed[] = [];
    const checkIdsForVotes: number[] = [];

    for (let i = 0; i < allSnoozeChecks.length; i++) {
      const votes = snoozeCheckToVotesMap.get(i);
      if (votes && votes.length > 0) {
        votesToInsert.push(...votes);
        // Repeat the snooze check ID for each vote
        checkIdsForVotes.push(...Array(votes.length).fill(snoozeCheckIds[i]));
      }
    }

    if (votesToInsert.length > 0) {
      return insertSnoozeVotesBulk(
        client,
        votesToInsert,
        checkIdsForVotes,
        baseDate
      );
    }

    return Promise.resolve();
  });
}
