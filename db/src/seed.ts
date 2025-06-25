import path from "path";
import {
  insertUsersBulk,
  insertSeasonsBulk,
  insertPredictionsBulk,
  insertBetsBulk,
  insertVotesBulk,
  insertSnoozeChecksBulk,
  insertSnoozeVotesBulk,
} from "./seedFunctions";
import {
  UserSeed,
  SeasonSeed,
  PredictionSeed,
  BetSeed,
  VoteSeed,
  SnoozeCheckSeed,
  SnoozeVoteSeed,
} from "./types";
import { createLogger } from "./utils";

// Import seed data
import devUsers from "./seeds/dev/users.json";
import devPredictions from "./seeds/dev/predictions.json";
import devSeasons from "./seeds/dev/seasons.json";
import testUsers from "./seeds/test/users.json";
import testPredictions from "./seeds/test/predictions.json";
import testSeasons from "./seeds/test/seasons.json";

interface SeedOptions {
  verbose?: boolean;
}

export default async (client: any, options: SeedOptions = {}) => {
  const { verbose = false } = options;
  const log = createLogger(verbose);

  if (process.env.NODE_ENV === "production") {
    return console.error("Cannot run seeding in production.");
  }

  // Determine seed data based on NODE_ENV
  const seedEnv = process.env.NODE_ENV === "test" ? "test" : "dev";

  const users = seedEnv === "test" ? testUsers : devUsers;
  const predictions = seedEnv === "test" ? testPredictions : devPredictions;
  const seasons = seedEnv === "test" ? testSeasons : devSeasons;

  log(`Loading seeds from ${seedEnv} environment`);
  log(
    `Found ${users.length} users, ${seasons.length} seasons, ${predictions.length} predictions`
  );

  const baseDate = new Date();

  try {
    // Insert all users in bulk
    log("Inserting users...");
    await insertUsersBulk(client, users);

    // Insert all seasons in bulk
    log("Inserting seasons...");
    await insertSeasonsBulk(client, seasons, baseDate);

    // Insert all predictions in bulk and get their IDs
    log("Inserting predictions...");
    const predictionsResult = await insertPredictionsBulk(
      client,
      predictions,
      baseDate
    );
    const predictionIds = predictionsResult.rows.map((row) => row.id);

    // Aggregate all bets, votes, and snooze checks for bulk insertion
    log("Aggregating related data...");
    const allBets: BetSeed[] = [];
    const allVotes: VoteSeed[] = [];
    const allSnoozeChecks: SnoozeCheckSeed[] = [];

    const betPredictionIds: number[] = [];
    const votePredictionIds: number[] = [];
    const snoozeCheckPredictionIds: number[] = [];
    const snoozeCheckToVotesMap: Map<number, SnoozeVoteSeed[]> = new Map();

    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i];
      const predictionId = predictionIds[i];

      // Collect bets
      if (prediction.bets && prediction.bets.length > 0) {
        allBets.push(...prediction.bets);
        betPredictionIds.push(
          ...Array(prediction.bets.length).fill(predictionId)
        );
      }

      // Collect votes
      if (prediction.votes && prediction.votes.length > 0) {
        allVotes.push(...prediction.votes);
        votePredictionIds.push(
          ...Array(prediction.votes.length).fill(predictionId)
        );
      }

      // Collect snooze checks
      if (prediction.checks && prediction.checks.length > 0) {
        allSnoozeChecks.push(...prediction.checks);
        snoozeCheckPredictionIds.push(
          ...Array(prediction.checks.length).fill(predictionId)
        );

        // Store snooze votes for later insertion
        for (let j = 0; j < prediction.checks.length; j++) {
          const check = prediction.checks[j];
          if (check.votes && check.votes.length > 0) {
            const checkIndex =
              allSnoozeChecks.length - prediction.checks.length + j;
            snoozeCheckToVotesMap.set(checkIndex, check.votes);
          }
        }
      }
    }

    // Insert all bets in bulk (if any exist)
    if (allBets.length > 0) {
      log(`Inserting ${allBets.length} bets...`);
      await insertBetsBulk(client, allBets, betPredictionIds, baseDate);
    }

    // Insert all votes in bulk (if any exist)
    if (allVotes.length > 0) {
      log(`Inserting ${allVotes.length} votes...`);
      await insertVotesBulk(client, allVotes, votePredictionIds, baseDate);
    }

    // Insert all snooze checks in bulk (if any exist)
    if (allSnoozeChecks.length > 0) {
      log(`Inserting ${allSnoozeChecks.length} snooze checks...`);
      const snoozeChecksResult = await insertSnoozeChecksBulk(
        client,
        allSnoozeChecks,
        snoozeCheckPredictionIds,
        baseDate
      );
      const snoozeCheckIds = snoozeChecksResult.rows.map((row: any) => row.id);

      // Insert snooze votes if any exist
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
        log(`Inserting ${votesToInsert.length} snooze votes...`);
        await insertSnoozeVotesBulk(
          client,
          votesToInsert,
          checkIdsForVotes,
          baseDate
        );
      }
    }

    log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  }
};
