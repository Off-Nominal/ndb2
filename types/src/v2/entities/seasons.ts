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
