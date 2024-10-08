import { APISnoozes } from "./snoozes";

export enum PredictionLifeCycle {
  OPEN = "open",
  CHECKING = "checking",
  RETIRED = "retired",
  CLOSED = "closed",
  SUCCESSFUL = "successful",
  FAILED = "failed",
}

export type PredictionDriver = "event" | "date";

export namespace APIPredictions {
  export type EnhancedPrediction = {
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
    checks: Omit<APISnoozes.EnhancedSnoozeCheck, "prediction_id">[];
    payouts: {
      endorse: number;
      undorse: number;
    };
  };

  export type ShortEnhancedPrediction = Omit<
    EnhancedPrediction,
    "bets" | "votes" | "checks"
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

  export type AddPrediction = { id: number };

  export type GetPredictionById = EnhancedPrediction;

  export type RetirePredictionById = EnhancedPrediction;

  export type ClosePredictionById = null;

  export type JudgePredictionById = EnhancedPrediction;

  export type GetNextPredictionToTrigger = { id: number; due_date: string };

  export type GetNextPredictionToCheck = { id: number; check_date: string };

  export type GetNextPredictionToJudge = { id: number };

  export type SearchPredictions = ShortEnhancedPrediction;

  export type SnoozePredictionById = { id: number };

  export type UndoClosePredictionById = null;

  export type SetCheckDateByPredictionId = null;
}
