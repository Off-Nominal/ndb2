export enum PredictionLifeCycle {
  OPEN = "open",
  RETIRED = "retired",
  CLOSED = "closed",
  SUCCESSFUL = "successful",
  FAILED = "failed",
}

export namespace APIPredictions {
  export type EnhancedPrediction = {
    id: number;
    predictor: {
      id: string;
      discord_id: string;
    };
    text: string;
    season_id: number | null;
    season_applicable: boolean;
    created_date: string;
    due_date: string;
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
      id: string;
      endorsed: boolean;
      date: string;
      wager: number;
      valid: boolean;
      payout: number;
      season_payout: number;
      better: {
        id: string;
        discord_id: string;
      };
    }[];
    votes: {
      id: string;
      vote: boolean;
      voted_date: string;
      voter: {
        id: string;
        discord_id: string;
      };
    }[];
    payouts: {
      endorse: number;
      undorse: number;
    };
  };

  export type ShortEnhancedPrediction = Omit<
    EnhancedPrediction,
    "bets" | "votes"
  > & {
    bets: {
      endorsements: number;
      undorsements: number;
      invalid: number;
    };
    votes: {
      yes: number;
      no: number;
    };
  };

  export type AddPrediction = EnhancedPrediction;

  export type GetPredictionById = EnhancedPrediction;

  export type RetirePredictionById = EnhancedPrediction;

  export type ClosePredictionById = EnhancedPrediction;

  export type JudgePredictionById = EnhancedPrediction;

  export type GetNextPredictionToTrigger = { id: number; due_date: string };

  export type GetNextPredictionToJudge = { id: number };

  export type SearchPredictions = ShortEnhancedPrediction;
}
