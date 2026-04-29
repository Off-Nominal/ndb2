import type { PredictionLifeCycle } from "./predictions";

export type Identifier = "current" | "past" | "future";

export type Season = {
  id: number;
  name: string;
  start: string;
  end: string;
  wager_cap: number;
  closed: boolean;
  identifier: Identifier;
};

/** Prediction counts by lifecycle status for GET /seasons/:id. */
export type SeasonPredictionCounts = Record<PredictionLifeCycle, number>;

/** Season detail from GET /seasons/:id (numeric id or current | past | future). */
export type SeasonDetail = Season & {
  predictions: SeasonPredictionCounts;
};

export type SeasonResults = {
  season: Season;
  predictions: {
    closed: number | null;
    successes: number | null;
    failures: number | null;
  };
  bets: {
    closed: number | null;
    successes: number | null;
    failures: number | null;
  };
  scores: {
    payouts: number;
    penalties: number;
  };
  largest_payout: {
    value: number;
    prediction_id: number;
    better: {
      id: string;
      discord_id: string;
    };
  } | null;
  largest_penalty: {
    value: number;
    prediction_id: number;
    better: {
      id: string;
      discord_id: string;
    };
  } | null;
};
