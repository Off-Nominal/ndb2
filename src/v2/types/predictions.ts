export namespace Predictions {
  export type PredictionDriver = "event" | "date";

  export type PredictionLifeCycle =
    | "open"
    | "checking"
    | "retired"
    | "closed"
    | "successful"
    | "failed";

  type Prediction = {
    id: number;
    predictor: {
      id: string;
      discord_id: string;
    };
    text: string;
    driver: PredictionDriver;
    season_id: number | null;
    season_applicable: boolean;
    created_date: Date;
    due_date: Date | null;
    check_date: Date | null;
    last_check_date: Date | null;
    closed_date: Date | null;
    triggered_date: Date | null;
    triggerer: {
      id: string;
      discord_id: string;
    } | null;
    judged_date: Date | null;
    retired_date: Date | null;
    status: PredictionLifeCycle;
    bets: {
      id: number;
      endorsed: boolean;
      date: Date;
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
      id: number;
      vote: boolean;
      voted_date: Date;
      voter: {
        id: string;
        discord_id: string;
      };
    }[];
    checks: {
      id: number;
      check_date: Date;
      closed: boolean;
      closed_at: Date | null;
      votes: {
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

  export type GET_ById = Prediction;

  export type DELETE_ById_trigger = void;
}
