export namespace APIPredictions {
  export type Prediction = {
    id: number;
    user_id: string;
    text: string;
    created_date: string;
    due_date: string;
    closed_date: string;
    judged_date: string;
    successful: boolean | null;
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
    closed_date: string;
    judged_date: string;
    successful: boolean | null;
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
}
