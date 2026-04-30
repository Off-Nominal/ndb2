import { PoolClient } from "pg";
import * as API from "@offnominal/ndb2-api-types/v2";
import {
  userParticipatesInSeason as userParticipatesInSeasonQuery,
  getSeasonResultsLeaderboard,
  countSeasonLeaderboardParticipants,
  getSeasonResultForUser as getSeasonResultForUserQuery,
  countUserSeasonsForResults,
  getUserSeasonResultsPage,
  getAllTimeResultForUser as getAllTimeResultForUserQuery,
  type IGetSeasonResultsLeaderboardResult,
  type IGetSeasonResultForUserResult,
  type IGetUserSeasonResultsPageResult,
  type IGetAllTimeResultForUserResult,
} from "./results.queries";

export const RESULTS_MAX_PER_PAGE = 100;
export const RESULTS_DEFAULT_PER_PAGE = 25;

function toIso(d: Date | string): string {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toISOString();
}

function mapRank(value: number | null | undefined): number | null {
  if (value == null) return null;
  return Number(value);
}

type ResultBreakdownRow = Pick<
  IGetSeasonResultForUserResult,
  | "predictions_successful"
  | "predictions_failed"
  | "predictions_open"
  | "predictions_closed"
  | "predictions_checking"
  | "predictions_retired"
  | "bets_successful"
  | "bets_failed"
  | "bets_pending"
  | "bets_retired"
  | "bets_invalid"
  | "votes_yes"
  | "votes_no"
  | "votes_affirmative"
  | "votes_negative"
  | "votes_pending"
  | "points_rewards"
  | "points_penalties"
  | "points_net"
  | "rank_points_net"
  | "rank_predictions_successful"
  | "rank_bets_successful"
>;

function mapFlatToBreakdowns(
  row: ResultBreakdownRow,
): Pick<
  API.Entities.Results.UserSeasonResult,
  "predictions" | "bets" | "votes" | "points"
> {
  return {
    predictions: {
      successful: Number(row.predictions_successful),
      failed: Number(row.predictions_failed),
      open: Number(row.predictions_open),
      closed: Number(row.predictions_closed),
      checking: Number(row.predictions_checking),
      retired: Number(row.predictions_retired),
      rank: mapRank(row.rank_predictions_successful),
    },
    bets: {
      successful: Number(row.bets_successful),
      failed: Number(row.bets_failed),
      pending: Number(row.bets_pending),
      retired: Number(row.bets_retired),
      invalid: Number(row.bets_invalid),
      rank: mapRank(row.rank_bets_successful),
    },
    votes: {
      yes: Number(row.votes_yes),
      no: Number(row.votes_no),
      affirmative: Number(row.votes_affirmative),
      negative: Number(row.votes_negative),
      pending: Number(row.votes_pending),
    },
    points: {
      rewards: Number(row.points_rewards),
      penalties: Number(row.points_penalties),
      net: Number(row.points_net),
      rank: mapRank(row.rank_points_net),
    },
  };
}

/** Postgres often marks derived/CTE columns nullable in Describe; PgTyped maps that to `string | null` even when rows always have a user id. */
function userFromSeasonOrLeaderboardRow(
  row: Pick<
    IGetSeasonResultForUserResult | IGetSeasonResultsLeaderboardResult,
    "user_id" | "discord_id"
  >,
): API.Entities.Results.UserSeasonResult["user"] {
  if (row.user_id == null) {
    throw new Error(
      "Results row missing user_id (leaderboard and season participant queries should always return it)",
    );
  }
  return { id: row.user_id, discord_id: row.discord_id };
}

function mapToSeasonLeaderboardRow(
  row: IGetSeasonResultsLeaderboardResult,
): API.Entities.Results.UserSeasonLeaderboardRow {
  return {
    user: userFromSeasonOrLeaderboardRow(row),
    ...mapFlatToBreakdowns(row),
  };
}

function mapToUserSeasonResult(
  row: IGetSeasonResultForUserResult | IGetAllTimeResultForUserResult,
): API.Entities.Results.UserSeasonResult {
  return {
    user: userFromSeasonOrLeaderboardRow(row),
    total_participants: Number(row.total_participants ?? 0),
    ...mapFlatToBreakdowns(row),
  };
}

function mapUserSeasonRow(
  row: IGetUserSeasonResultsPageResult,
): API.Entities.Results.UserSeasonResultRow {
  return {
    season: {
      id: row.season_id,
      name: row.season_name,
      start: toIso(row.season_start),
      end: toIso(row.season_end),
    },
    total_participants: Number(row.total_participants ?? 0),
    ...mapFlatToBreakdowns(row),
  };
}

export type SeasonLeaderboardInput = {
  season_id: number;
  sort_by: API.Endpoints.Seasons.SeasonLeaderboardSortBy;
  page: number;
  per_page: number;
};

export type UserSeasonResultsListInput = {
  user_id: string;
  sort_by: API.Endpoints.Users.UserSeasonsResultsSortBy;
  page: number;
  per_page: number;
};

function clampPerPage(per_page: number): number {
  return Math.min(Math.max(1, per_page), RESULTS_MAX_PER_PAGE);
}

export default {
  userParticipatesInSeason:
    (dbClient: PoolClient) =>
    async (params: { season_id: number; user_id: string }) => {
      const [row] = await userParticipatesInSeasonQuery.run(params, dbClient);
      return Boolean(row?.participates);
    },

  getSeasonLeaderboard:
    (dbClient: PoolClient) => async (input: SeasonLeaderboardInput) => {
      const per_page = clampPerPage(input.per_page);
      const page = Math.max(1, input.page);
      const row_offset = (page - 1) * per_page;

      const [countRow] = await countSeasonLeaderboardParticipants.run(
        { season_id: input.season_id },
        dbClient,
      );
      const total_count = countRow?.total_count ?? 0;

      const rows = await getSeasonResultsLeaderboard.run(
        {
          season_id: input.season_id,
          sort_by: input.sort_by,
          limit: per_page,
          row_offset,
        },
        dbClient,
      );

      return {
        meta: { page, per_page, total_count },
        results: rows.map((r) => mapToSeasonLeaderboardRow(r)),
      };
    },

  getSeasonResultForUser:
    (dbClient: PoolClient) =>
    async (season_id: number, user_id: string) => {
      const [row] = await getSeasonResultForUserQuery.run(
        { season_id, user_id },
        dbClient,
      );
      if (!row) return null;
      return mapToUserSeasonResult(row);
    },

  getUserSeasonResults:
    (dbClient: PoolClient) => async (input: UserSeasonResultsListInput) => {
      const per_page = clampPerPage(input.per_page);
      const page = Math.max(1, input.page);
      const row_offset = (page - 1) * per_page;

      const [countRow] = await countUserSeasonsForResults.run(
        { user_id: input.user_id },
        dbClient,
      );
      const total_count = countRow?.total_count ?? 0;

      const rows = await getUserSeasonResultsPage.run(
        {
          user_id: input.user_id,
          sort_by: input.sort_by,
          limit: per_page,
          row_offset,
        },
        dbClient,
      );

      return {
        meta: { page, per_page, total_count },
        results: rows.map(mapUserSeasonRow),
      };
    },

  getAllTimeResultForUser:
    (dbClient: PoolClient) => async (user_id: string) => {
      const [row] = await getAllTimeResultForUserQuery.run(
        { user_id },
        dbClient,
      );
      if (!row) return null;
      return mapToUserSeasonResult(row);
    },
};
