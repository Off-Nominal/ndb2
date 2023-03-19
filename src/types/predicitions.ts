export enum PredictionLifeCycle {
  OPEN = "open",
  RETIRED = "retired",
  CLOSED = "closed",
  SUCCESSFUL = "successful",
  FAILED = "failed",
}

export namespace APIPredictions {
  export type Prediction = {
    id: number;
    user_id: string;
    text: string;
    created_date: string;
    due_date: string;
    closed_date: string;
    judged_date: string;
    retired_date: string | null;
  };

  export type EnhancedPrediction = {
    id: number;
    predictor: {
      id: string;
      discord_id: string;
    };
    text: string;
    created_date: string;
    due_date: string;
    closed_date: string | null;
    judged_date: string | null;
    retired_date: string | null;
    status: PredictionLifeCycle;
    bets: {
      id: string;
      endorsed: boolean;
      date: string;
      better: {
        id: string;
        discord_id: string;
      };
    }[];
    payouts: {
      endorse: number;
      undorse: number;
    };
  };

  export type AddPrediction = Prediction;

  export type GetPredictionById = EnhancedPrediction;

  export type RetirePredictionById = EnhancedPrediction;
}
