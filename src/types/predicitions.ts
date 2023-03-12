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

  export type AddPrediction = Prediction;
}
