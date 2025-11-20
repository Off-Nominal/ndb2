import { PoolClient } from "pg";
import { getBetsByPredictionId } from "../bets/bets.queries";
import { getSnoozeChecksByPredictionId } from "../snooze_checks/snooze_checks.queries";
import { getVotesByPredictionId } from "../votes/votes.queries";
import {
  getPredictionsById,
  insertDateDrivenPrediction,
  insertEventDrivenPrediction,
  prediction_driver,
  retirePredictionById,
  untriggerPredictionById,
} from "./predictions.queries";
import * as API from "@offnominal/ndb2-api-types/v2";
import betsQueries from "../bets";

export default {
  getById:
    (dbClient: PoolClient) =>
    async (
      prediction_id: number
    ): Promise<API.Entities.Predictions.Prediction | undefined> => {
      // Queries
      const [predictionResult, betsResult, votesResult, checksResult] =
        await Promise.all([
          getPredictionsById.run({ prediction_id }, dbClient),
          getBetsByPredictionId.run({ prediction_id }, dbClient),
          getVotesByPredictionId.run({ prediction_id }, dbClient),
          getSnoozeChecksByPredictionId.run({ prediction_id }, dbClient),
        ]);

      if (predictionResult.length === 0) {
        return undefined;
      }

      const prediction = predictionResult[0];

      const triggerer =
        prediction.triggerer_id === null
          ? null
          : {
              id: prediction.triggerer_id,
              discord_id: prediction.trigerer_discord_id,
            };

      const predictionDTO: API.Endpoints.Predictions.GET_ById.Data = {
        id: prediction.id,
        predictor: {
          id: prediction.predictor_id,
          discord_id: prediction.predictor_discord_id,
        },
        text: prediction.text,
        driver: prediction.driver,
        season_id: prediction.season_id,
        season_applicable: prediction.season_applicable,
        created_date: prediction.created_date.toString(),
        due_date: prediction.due_date ? prediction.due_date.toString() : null,
        check_date: prediction.check_date
          ? prediction.check_date.toString()
          : null,
        last_check_date: prediction.last_check_date
          ? prediction.last_check_date.toString()
          : null,
        closed_date: prediction.closed_date
          ? prediction.closed_date.toString()
          : null,
        triggered_date: prediction.triggered_date
          ? prediction.triggered_date.toString()
          : null,
        triggerer,
        judged_date: prediction.judged_date
          ? prediction.judged_date.toString()
          : null,
        retired_date: prediction.retired_date
          ? prediction.retired_date.toString()
          : null,
        status: prediction.status,
        bets: betsResult.map((bet) => ({
          id: bet.id,
          endorsed: bet.endorsed,
          date: bet.date.toString(),
          wager: bet.wager,
          valid: bet.valid,
          payout: bet.payout,
          season_payout: bet.season_payout,
          better: {
            id: bet.better_id,
            discord_id: bet.better_discord_id,
          },
        })),
        votes: votesResult.map((vote) => ({
          id: vote.id,
          vote: vote.vote,
          voted_date: vote.voted_date.toString(),
          voter: {
            id: vote.voter_id,
            discord_id: vote.voter_discord_id,
          },
        })),
        checks: checksResult.map((check) => ({
          id: check.id,
          check_date: check.check_date.toString(),
          closed: check.closed,
          closed_at: check.closed_at ? check.closed_at.toString() : null,
          values: {
            day: parseInt(check.votes_day),
            week: parseInt(check.votes_week),
            month: parseInt(check.votes_month),
            quarter: parseInt(check.votes_quarter),
            year: parseInt(check.votes_year),
          },
        })),
        payouts: {
          endorse: parseFloat(prediction.endorse),
          undorse: parseFloat(prediction.undorse),
        },
      };

      return predictionDTO;
    },
  untriggerById:
    (dbClient: PoolClient) =>
    async (prediction_id: number): Promise<null> => {
      await untriggerPredictionById.run({ prediction_id }, dbClient);
      return null;
    },
  retireById:
    (dbClient: PoolClient) =>
    async (prediction_id: number): Promise<null> => {
      await retirePredictionById.run({ prediction_id }, dbClient);
      return null;
    },
  create:
    (dbClient: PoolClient) =>
    async (params: {
      user_id: string;
      text: string;
      created_date: Date;
      driver: prediction_driver;
      date: Date;
    }): Promise<number> => {
      await dbClient.query("BEGIN");

      const { user_id, text, created_date, date } = params;

      let prediction_id: number;
      if (params.driver === "event") {
        const [insertResult] = await insertEventDrivenPrediction.run(
          {
            user_id,
            text,
            created_date,
            check_date: date,
          },
          dbClient
        );
        prediction_id = insertResult.id;
      } else {
        const [insertResult] = await insertDateDrivenPrediction.run(
          {
            user_id,
            text,
            created_date,
            due_date: date,
          },
          dbClient
        );
        prediction_id = insertResult.id;
      }

      if (!prediction_id) {
        throw new Error(`Failed to insert ${params.driver}-driven prediction`);
      }

      // Automatically endorse own prediction
      await betsQueries.add(dbClient)({
        user_id: params.user_id,
        prediction_id: prediction_id,
        endorsed: true,
        date: params.created_date,
      });

      await dbClient.query("COMMIT");

      return prediction_id;
    },
};
