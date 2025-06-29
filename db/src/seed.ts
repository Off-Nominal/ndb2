import {
  insertUsersBulk,
  insertSeasonsBulk,
  insertPredictionsBulk,
  insertBetsBulk,
  insertVotesBulk,
  insertSnoozeChecksBulk,
  insertSnoozeVotesBulk,
  retirePredictionsBulk,
  triggerPredictionsBulk,
  judgePredictionsBulk,
  closeSnoozeChecksBulk,
} from "./seedFunctions";
import { BetSeed, VoteSeed, SnoozeCheckSeed, SnoozeVoteSeed } from "./types";
import { createLogger } from "./utils";
import { resolveSeedDate } from "./utils/dateUtils";

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
    // Step 1: Insert all users in bulk
    log("Step 1: Inserting users...");
    await insertUsersBulk(client, users);

    // Step 2: Insert all seasons in bulk
    log("Step 2: Inserting seasons...");
    await insertSeasonsBulk(client, seasons, baseDate);

    // Step 3: Create the base prediction entities with most properties including created_date, check_date, due_date
    log("Step 3: Inserting base predictions...");
    const predictionsResult = await insertPredictionsBulk(
      client,
      predictions,
      baseDate
    );
    const predictionIds = predictionsResult.rows.map((row) => row.id);
    const predictionCreatedDates = predictionsResult.rows.map(
      (row) => row.created_date
    );

    // Step 4: Create all the bets entities
    log("Step 4: Inserting bets...");
    const allBets: BetSeed[] = [];
    const betPredictionIds: number[] = [];
    const betCreatedDates: Date[] = [];

    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i];
      const predictionId = predictionIds[i];
      const predictionCreatedDate = predictionCreatedDates[i];

      if (prediction.bets && prediction.bets.length > 0) {
        allBets.push(...prediction.bets);
        betPredictionIds.push(
          ...Array(prediction.bets.length).fill(predictionId)
        );
        betCreatedDates.push(
          ...Array(prediction.bets.length).fill(predictionCreatedDate)
        );
      }
    }

    if (allBets.length > 0) {
      log(`Inserting ${allBets.length} bets...`);
      await insertBetsBulk(client, allBets, betPredictionIds, betCreatedDates);
    }

    // Step 5: Retire any predictions with retired properties in the seeds
    log("Step 5: Retiring predictions...");
    const predictionsToRetire: number[] = [];
    const retiredDates: Date[] = [];

    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i];
      const predictionId = predictionIds[i];

      if ("retired" in prediction && prediction.retired) {
        const createdDate = resolveSeedDate(prediction.baseDate, baseDate);
        const retiredDate = resolveSeedDate(prediction.retired, createdDate);
        predictionsToRetire.push(predictionId);
        retiredDates.push(retiredDate);
      }
    }

    if (predictionsToRetire.length > 0) {
      log(`Retiring ${predictionsToRetire.length} predictions...`);
      await retirePredictionsBulk(client, predictionsToRetire, retiredDates);
    }

    // Step 6: Create any snooze checks and snooze votes
    log("Step 6: Inserting snooze checks and votes...");
    const allSnoozeChecks: SnoozeCheckSeed[] = [];
    const snoozeCheckPredictionIds: number[] = [];
    const snoozeCheckCreatedDates: Date[] = [];
    const snoozeCheckToVotesMap: Map<number, SnoozeVoteSeed[]> = new Map();

    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i];
      const predictionId = predictionIds[i];
      const predictionCreatedDate = predictionCreatedDates[i];

      if (prediction.checks && prediction.checks.length > 0) {
        allSnoozeChecks.push(...prediction.checks);
        snoozeCheckPredictionIds.push(
          ...Array(prediction.checks.length).fill(predictionId)
        );
        snoozeCheckCreatedDates.push(
          ...Array(prediction.checks.length).fill(predictionCreatedDate)
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

    if (allSnoozeChecks.length > 0) {
      log(`Inserting ${allSnoozeChecks.length} snooze checks...`);
      const snoozeChecksResult = await insertSnoozeChecksBulk(
        client,
        allSnoozeChecks,
        snoozeCheckPredictionIds,
        snoozeCheckCreatedDates
      );
      const snoozeCheckIds = snoozeChecksResult.rows.map((row: any) => row.id);

      // Insert snooze votes if any exist
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
            ...Array(votes.length).fill(snoozeCheckCreatedDates[i])
          );
        }
      }

      if (votesToInsert.length > 0) {
        log(`Inserting ${votesToInsert.length} snooze votes...`);
        await insertSnoozeVotesBulk(
          client,
          votesToInsert,
          checkIdsForVotes,
          voteCreatedDates
        );
      }

      // Step 7: Close any snooze checks with closed_at properties set
      log("Step 7: Closing snooze checks...");
      const checksToClose: number[] = [];
      const checkClosedDates: Date[] = [];

      for (let i = 0; i < allSnoozeChecks.length; i++) {
        const check = allSnoozeChecks[i];
        const checkId = snoozeCheckIds[i];

        if (check.closed) {
          // Find which prediction this snooze check belongs to
          let predictionIndex = 0;
          let checkCount = 0;
          for (let j = 0; j < predictions.length; j++) {
            const predChecks = predictions[j].checks || [];
            if (i >= checkCount && i < checkCount + predChecks.length) {
              predictionIndex = j;
              break;
            }
            checkCount += predChecks.length;
          }

          const prediction = predictions[predictionIndex];
          const predictionCreatedDate = predictionCreatedDates[predictionIndex];
          const closedDate = resolveSeedDate(
            check.closed,
            predictionCreatedDate
          );
          checksToClose.push(checkId);
          checkClosedDates.push(closedDate);
        }
      }

      if (checksToClose.length > 0) {
        log(`Closing ${checksToClose.length} snooze checks...`);
        await closeSnoozeChecksBulk(client, checksToClose, checkClosedDates);
      }
    }

    // Step 8: Trigger any predictions with triggered_date properties and set their closed_date properties
    log("Step 8: Triggering predictions...");
    const predictionsToTrigger: number[] = [];
    const triggeredDates: Date[] = [];
    const closedDates: Date[] = [];
    const triggererIds: string[] = [];

    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i];
      const predictionId = predictionIds[i];

      if (
        "triggered" in prediction &&
        prediction.triggered &&
        "closed" in prediction &&
        prediction.closed
      ) {
        const createdDate = resolveSeedDate(prediction.baseDate, baseDate);
        const triggeredDate = resolveSeedDate(
          prediction.triggered,
          createdDate
        );
        const closedDate = resolveSeedDate(prediction.closed, createdDate);
        predictionsToTrigger.push(predictionId);
        triggeredDates.push(triggeredDate);
        closedDates.push(closedDate);
        triggererIds.push(
          "triggerer" in prediction && prediction.triggerer
            ? (prediction.triggerer as string)
            : null
        );
      }
    }

    if (predictionsToTrigger.length > 0) {
      log(`Triggering ${predictionsToTrigger.length} predictions...`);
      await triggerPredictionsBulk(
        client,
        predictionsToTrigger,
        triggeredDates,
        closedDates,
        triggererIds
      );
    }

    // Step 9: Create any votes entities
    log("Step 9: Inserting votes...");
    const allVotes: VoteSeed[] = [];
    const votePredictionIds: number[] = [];
    const voteCreatedDates: Date[] = [];

    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i];
      const predictionId = predictionIds[i];
      const predictionCreatedDate = predictionCreatedDates[i];

      if (prediction.votes && prediction.votes.length > 0) {
        allVotes.push(...prediction.votes);
        votePredictionIds.push(
          ...Array(prediction.votes.length).fill(predictionId)
        );
        voteCreatedDates.push(
          ...Array(prediction.votes.length).fill(predictionCreatedDate)
        );
      }
    }

    if (allVotes.length > 0) {
      log(`Inserting ${allVotes.length} votes...`);
      await insertVotesBulk(
        client,
        allVotes,
        votePredictionIds,
        voteCreatedDates
      );
    }

    // Step 10: Finalize any predictions with judged_date properties
    log("Step 10: Judging predictions...");
    const predictionsToJudge: number[] = [];
    const judgedDates: Date[] = [];

    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i];
      const predictionId = predictionIds[i];

      if ("judged" in prediction && prediction.judged) {
        const createdDate = resolveSeedDate(prediction.baseDate, baseDate);
        const judgedDate = resolveSeedDate(prediction.judged, createdDate);
        predictionsToJudge.push(predictionId);
        judgedDates.push(judgedDate);
      }
    }

    if (predictionsToJudge.length > 0) {
      log(`Judging ${predictionsToJudge.length} predictions...`);
      await judgePredictionsBulk(client, predictionsToJudge, judgedDates);
    }

    log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  }
};
