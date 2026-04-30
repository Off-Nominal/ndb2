/** Per-user result aggregates (season or all-time scope). */

export type ResultUser = {
  id: string;
  discord_id: string;
};

export type ResultPredictions = {
  successful: number;
  failed: number;
  open: number;
  closed: number;
  checking: number;
  retired: number;
  /** 1-based rank by `successful` count (desc) among participants in the same scope. Null only when the user has no all-time footprint (not in global participants). */
  rank: number | null;
};

export type ResultBets = {
  successful: number;
  failed: number;
  pending: number;
  retired: number;
  invalid: number;
  /** 1-based rank by `successful` bet count (desc) among participants in the same scope. */
  rank: number | null;
};

export type ResultVotes = {
  /** Raw ballot: vote is yes. */
  yes: number;
  /** Raw ballot: vote is no. */
  no: number;
  /** Vote matches resolved outcome (yes on successful, no on failed). */
  affirmative: number;
  /** Vote opposes resolved outcome (no on successful, yes on failed). */
  negative: number;
  /** Votes on predictions still `closed` (success/failure not known yet for affirmative vs negative). */
  pending: number;
};

export type ResultPoints = {
  /** Sum of positive `season_payout` / `payout` values. */
  rewards: number;
  /** Sum of negative payout values (non-positive total). */
  penalties: number;
  /** `rewards + penalties` (algebraically). */
  net: number;
  /** 1-based rank by net points (desc) among participants in the same scope. */
  rank: number | null;
};

export type UserSeasonResult = {
  user: ResultUser;
  predictions: ResultPredictions;
  bets: ResultBets;
  votes: ResultVotes;
  points: ResultPoints;
  /** Distinct users with activity in this season or globally (all-time). Not repeated on cross-user result list rows; see {@link UserSeasonLeaderboardRow} and `meta.total_count`. */
  total_participants: number;
};

/** One entry of `GET /results/seasons/:seasonId` or `GET /results/all-time` — same as {@link UserSeasonResult} without `total_participants` (`meta.total_count` is the participant count). */
export type UserSeasonLeaderboardRow = Omit<UserSeasonResult, "total_participants">;

export type SeasonResultSummary = {
  id: number;
  name: string;
  start: string;
  end: string;
};

/** One row of `GET /results/users/discord_id/:discord_id/seasons` — result for a single season. */
export type UserSeasonResultRow = {
  season: SeasonResultSummary;
  /** Distinct users with activity in this season (same basis as season leaderboard `meta.total_count`). */
  total_participants: number;
  predictions: ResultPredictions;
  bets: ResultBets;
  votes: ResultVotes;
  points: ResultPoints;
};

export type PaginatedMeta = {
  page: number;
  per_page: number;
  total_count: number;
};
