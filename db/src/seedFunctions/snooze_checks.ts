import { PredictionSeed, SnoozeCheckSeed, SnoozeVoteSeed } from "../types.js";
import { resolveSeedDate } from "../utils/dateUtils.js";

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
  createdDates: Date[]
): {
  prediction_ids: number[];
  check_dates: Date[];
  closed: boolean[];
  closed_ats: (Date | null)[];
} {
  const check_dates: Date[] = [];
  const closed: boolean[] = [];
  const closed_ats: (Date | null)[] = [];

  for (let i = 0; i < snoozeCheckSeeds.length; i++) {
    const check = snoozeCheckSeeds[i];
    const createdDate = createdDates[i];

    check_dates.push(resolveSeedDate(check.checked, createdDate));
    closed.push(!!check.closed);
    closed_ats.push(
      check.closed ? resolveSeedDate(check.closed, createdDate) : null
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
  createdDates: Date[]
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
    const createdDate = createdDates[i];

    user_ids.push(vote.user_id);
    values.push(vote.value);
    created_ats.push(resolveSeedDate(vote.created, createdDate));
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
  createdDates: Date[]
) {
  const bulkData = createSnoozeChecksBulkInsertData(
    snoozeCheckSeeds,
    predictionIds,
    createdDates
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
  createdDates: Date[]
) {
  const bulkData = createSnoozeVotesBulkInsertData(
    snoozeVoteSeeds,
    snoozeCheckIds,
    createdDates
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
  createdDates: Date[]
) {
  // Extract all snooze checks from predictions
  const allSnoozeChecks: SnoozeCheckSeed[] = [];
  const allSnoozeVotes: SnoozeVoteSeed[] = [];
  const snoozeCheckToVotesMap: Map<number, SnoozeVoteSeed[]> = new Map();
  const predictionIds: number[] = [];
  const checkCreatedDates: Date[] = [];

  for (let i = 0; i < predictionSeeds.length; i++) {
    const prediction = predictionSeeds[i];
    const createdDate = createdDates[i];

    if (prediction.checks && Array.isArray(prediction.checks)) {
      for (const check of prediction.checks) {
        // Create snooze check without prediction_id (it will be passed separately)
        const snoozeCheck: SnoozeCheckSeed = {
          checked: check.checked,
          closed: check.closed,
          values: check.values,
        };

        allSnoozeChecks.push(snoozeCheck);
        predictionIds.push(prediction.id);
        checkCreatedDates.push(createdDate);

        // Store votes for later insertion
        if (check.values && Array.isArray(check.values)) {
          snoozeCheckToVotesMap.set(allSnoozeChecks.length - 1, check.values);
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
    checkCreatedDates
  ).then((result: any) => {
    const snoozeCheckIds = result.rows.map((row: any) => row.id);

    // Prepare votes for bulk insertion
    const votesToInsert: SnoozeVoteSeed[] = [];
    const checkIdsForVotes: number[] = [];
    const voteCreatedDates: Date[] = [];

    for (let i = 0; i < allSnoozeChecks.length; i++) {
      const votes = snoozeCheckToVotesMap.get(i);
      if (votes && votes.length > 0) {
        votesToInsert.push(...votes);
        // Repeat the snooze check ID for each vote
        checkIdsForVotes.push(...Array(votes.length).fill(snoozeCheckIds[i]));
        // Repeat the created date for each vote
        voteCreatedDates.push(
          ...Array(votes.length).fill(checkCreatedDates[i])
        );
      }
    }

    if (votesToInsert.length > 0) {
      return insertSnoozeVotesBulk(
        client,
        votesToInsert,
        checkIdsForVotes,
        voteCreatedDates
      );
    }

    return Promise.resolve();
  });
}
