export type PredictionDriver = "event" | "date";

export type PredictionLifeCycle =
  | "checking"
  | "closed"
  | "failed"
  | "open"
  | "retired"
  | "successful";

export type Prediction = {
  id: number;
  predictor: {
    id: string;
    discord_id: string;
  };
  text: string;
  driver: PredictionDriver;
  season_id: number | null;
  season_applicable: boolean;
  created_date: string;
  due_date: string | null;
  check_date: string | null;
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
