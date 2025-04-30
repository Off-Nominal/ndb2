import { getBetsByPredictionId } from "../bets/bets.queries";
import { getSnoozeChecksByPredictionId } from "../snooze_checks/snooze_checks.queries";
import { getVotesByPredictionId } from "../votes/votes.queries";
import {
  getPredictionsById,
  untriggerPredictionById,
} from "./predictions.queries";
import type API from "@offnominal/ndb2-api-types/v2";

export default {
  getById:
    (dbClient: any) =>
    async (
      prediction_id: number
    ): Promise<API.Endpoints.Predictions.GET_ById.Data | undefined> => {
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
        created_date: prediction.created_date,
        due_date: prediction.due_date,
        check_date: prediction.check_date,
        last_check_date: prediction.last_check_date,
        closed_date: prediction.closed_date,
        triggered_date: prediction.triggered_date,
        triggerer,
        judged_date: prediction.judged_date,
        retired_date: prediction.retired_date,
        status: prediction.status,
        bets: betsResult.map((bet) => ({
          id: bet.id,
          endorsed: bet.endorsed,
          date: bet.date,
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
          voted_date: vote.voted_date,
          voter: {
            id: vote.voter_id,
            discord_id: vote.voter_discord_id,
          },
        })),
        checks: checksResult.map((check) => ({
          id: check.id,
          check_date: check.check_date,
          closed: check.closed,
          closed_at: check.closed_at,
          votes: {
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
    (dbClient: any) =>
    async (
      prediction_id: number
    ): Promise<API.Endpoints.Predictions.DELETE_ById_trigger.Data> => {
      await untriggerPredictionById.run({ prediction_id }, dbClient);
      return null;
    },
};
