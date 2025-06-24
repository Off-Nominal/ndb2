import path from "path";
import {
  insertUsersBulk,
  insertSeasonsBulk,
  insertPredictionsBulk,
  insertBetsBulk,
  insertVotesBulk,
} from "./seedFunctions";
import {
  UserSeed,
  SeasonSeed,
  PredictionSeed,
  BetSeed,
  VoteSeed,
} from "./types";
import { createLogger } from "./utils";

interface SeedOptions {
  verbose?: boolean;
}

export default async (client: any, options: SeedOptions = {}) => {
  const { verbose = false } = options;
  const log = createLogger(verbose);

  if (process.env.NODE_ENV === "production") {
    return console.error("Cannot run seeding in production.");
  }

  // Determine seed directory based on NODE_ENV
  const seedEnv = process.env.NODE_ENV === "test" ? "test" : "dev";
  const seedPath = path.join(__dirname, "seeds", seedEnv);

  // Dynamically import seed files
  let users: UserSeed[], predictions: PredictionSeed[], seasons: SeasonSeed[];

  try {
    users = require(path.join(seedPath, "users.json"));
    predictions = require(path.join(seedPath, "predictions.json"));
    seasons = require(path.join(seedPath, "seasons.json"));
  } catch (error) {
    console.error(`Error loading seed files from ${seedPath}:`, error);
    throw error;
  }

  log(`Loading seeds from ${seedPath} directory`);
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

    // Aggregate all bets and votes for bulk insertion
    log("Aggregating related data...");
    const allBets: BetSeed[] = [];
    const allVotes: VoteSeed[] = [];
    const betPredictionIds: number[] = [];
    const votePredictionIds: number[] = [];

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

    log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  }
};
