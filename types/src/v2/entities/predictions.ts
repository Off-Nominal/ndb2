export type PredictionDriver = "event" | "date";

export const PREDICTION_LIFECYCLE_VALUES = [
  "checking",
  "closed",
  "failed",
  "open",
  "retired",
  "successful",
] as const;

export type PredictionLifeCycle = (typeof PREDICTION_LIFECYCLE_VALUES)[number];

export type PredictionSearchBetTallies = {
  endorsements: number;
  undorsements: number;
  invalid: number;
};

export type PredictionSearchVoteTallies = {
  yes: number;
  no: number;
};

type EventDrivenPrediction = {
  driver: Extract<PredictionDriver, "event">;
  check_date: string;
  due_date: null;
};

type DateDrivenPrediction = {
  driver: Extract<PredictionDriver, "date">;
  due_date: string;
  check_date: null;
};

type PredictionDriverData = EventDrivenPrediction | DateDrivenPrediction;

/** Prediction row returned by GET /predictions/search (aggregated bets/votes). */
export type PredictionSearchResult = PredictionDriverData & {
  id: number;
  predictor: {
    id: string;
    discord_id: string;
  };
  text: string;
  season_id: number | null;
  season_applicable: boolean;
  created_date: string;
  last_check_date: string | null;
  closed_date: string | null;
  triggered_date: string | null;
  triggerer: {
    id: string;
    discord_id: string;
  } | null;
  judged_date: string | null;
  retired_date: string | null;
  status: PredictionLifeCycle;
  bets: PredictionSearchBetTallies;
  votes: PredictionSearchVoteTallies;
  payouts: {
    endorse: number;
    undorse: number;
  };
};

export type Prediction = PredictionDriverData & {
  id: number;
  predictor: {
    id: string;
    discord_id: string;
  };
  text: string;
  season_id: number | null;
  season_applicable: boolean;
  created_date: string;
  last_check_date: string | null;
  closed_date: string | null;
  triggered_date: string | null;
  triggerer: {
    id: string;
    discord_id: string;
  } | null;
  judged_date: string | null;
  retired_date: string | null;
  status: PredictionLifeCycle;
  bets: {
    id: number;
    endorsed: boolean;
    date: string;
    wager: number;
    valid: boolean;
    payout: number | null;
    season_payout: number | null;
    better: {
      id: string;
      discord_id: string;
    };
  }[];
  votes: {
    id: number;
    vote: boolean;
    voted_date: string;
    voter: {
      id: string;
      discord_id: string;
    };
  }[];
  checks: {
    id: number;
    check_date: string;
    closed: boolean;
    closed_at: string | null;
    values: {
      day: number;
      week: number;
      month: number;
      quarter: number;
      year: number;
    };
  }[];
  payouts: {
    endorse: number;
    undorse: number;
  };
};
