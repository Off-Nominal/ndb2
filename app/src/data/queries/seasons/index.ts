import { isBefore } from "date-fns";
import {
  closeSeasonById,
  getAllSeasons,
  getSeasonById,
  getSeasonResultsById,
  IGetSeasonByIdResult,
} from "./seasons.queries";
import * as API from "@offnominal/ndb2-api-types/v2";
import { PoolClient } from "pg";

const getIdentifier = (
  start: Date,
  end: Date,
): API.Entities.Seasons.Identifier => {
  const now = new Date();
  if (isBefore(end, now)) {
    return "past";
  }

  if (isBefore(now, start)) {
    return "future";
  }

  return "current";
};

const mapSeasonDetailRow = (
  row: IGetSeasonByIdResult,
): API.Entities.Seasons.SeasonDetail => ({
  id: row.id,
  name: row.name,
  start: row.start.toISOString(),
  end: row.end.toISOString(),
  wager_cap: row.wager_cap,
  closed: row.closed,
  identifier: getIdentifier(new Date(row.start), new Date(row.end)),
  predictions: {
    checking: row.predictions_checking ?? 0,
    closed: row.predictions_closed ?? 0,
    failed: row.predictions_failed ?? 0,
    open: row.predictions_open ?? 0,
    retired: row.predictions_retired ?? 0,
    successful: row.predictions_successful ?? 0,
  },
});

const seasonsQueries = {
  getAll: (dbClient: PoolClient) => async () => {
    const result = await getAllSeasons.run(undefined, dbClient);

    const seasons = result.map((season) => ({
      ...season,
      start: season.start.toISOString(),
      end: season.end.toISOString(),
      identifier: getIdentifier(new Date(season.start), new Date(season.end)),
    }));

    return seasons;
  },
  getById: (dbClient: PoolClient) => async (id: number) => {
    const result = await getSeasonById.run({ id }, dbClient);
    const season = result[0];

    if (!season) {
      return null;
    }

    return mapSeasonDetailRow(season);
  },
  getSeasonIdByIdentifier:
    (dbClient: PoolClient) =>
    async (
      identifier: API.Entities.Seasons.Identifier,
    ): Promise<number | null> => {
      const rows = await getAllSeasons.run(undefined, dbClient);
      for (const row of rows) {
        const computed = getIdentifier(new Date(row.start), new Date(row.end));
        if (computed === identifier) {
          return row.id;
        }
      }
      return null;
    },
  closeById: (dbClient: PoolClient) => async (id: number) => {
    await closeSeasonById.run({ id }, dbClient);
    return null;
  },
  getResultsById: (dbClient: PoolClient) => async (id: number) => {
    const [row] = await getSeasonResultsById.run({ id }, dbClient);
    if (!row) {
      return null;
    }

    const season: API.Entities.Seasons.Season = {
      id: row.season_id,
      name: row.season_name,
      start: row.season_start.toISOString(),
      end: row.season_end.toISOString(),
      wager_cap: row.season_wager_cap,
      closed: row.season_closed,
      identifier: getIdentifier(row.season_start, row.season_end),
    };

    return {
      season,
      predictions: {
        closed: row.predictions_closed,
        successes: row.predictions_successes,
        failures: row.predictions_failures,
      },
      bets: {
        closed: row.bets_closed,
        successes: row.bets_successes,
        failures: row.bets_failures,
      },
      scores: {
        payouts: Number(row.scores_payouts),
        penalties: Number(row.scores_penalties),
      },
      largest_payout:
        row.largest_payout_value === null
          ? null
          : {
              value: Number(row.largest_payout_value),
              prediction_id: row.largest_payout_prediction_id!,
              better: {
                id: row.largest_payout_better_id!,
                discord_id: row.largest_payout_better_discord_id!,
              },
            },
      largest_penalty:
        row.largest_penalty_value === null
          ? null
          : {
              value: Number(row.largest_penalty_value),
              prediction_id: row.largest_penalty_prediction_id!,
              better: {
                id: row.largest_penalty_better_id!,
                discord_id: row.largest_penalty_better_discord_id!,
              },
            },
    };
  },
};

export default seasonsQueries;
