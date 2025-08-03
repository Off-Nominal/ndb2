import { getBetsByPredictionId } from "../bets/bets.queries";
import { getSnoozeChecksByPredictionId } from "../snooze_checks/snooze_checks.queries";
import { getVotesByPredictionId } from "../votes/votes.queries";
import {
  getPredictionsById,
  untriggerPredictionById,
  predictionIsOfStatus,
} from "./predictions.queries";
import * as API from "@offnominal/ndb2-api-types/v2";

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
  isOfStatus:
    (dbClient: any) =>
    async (
      prediction_id: number,
      allowed_statuses: API.Entities.Predictions.PredictionLifeCycle[]
    ): Promise<boolean> => {
      const result = await predictionIsOfStatus.run(
        { prediction_id, allowed_statuses },
        dbClient
      );
      return result[0].exists ?? false;
    },
};
