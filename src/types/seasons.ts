export namespace APISeasons {
  export type Season = {
    id: number;
    name: string;
    start: string;
    end: string;
    wager_cap: number;
  };

  export type EnhancedSeason = Season & {
    identifier: "current" | "past" | "future";
  };

  export type GetSeasonByIdentifier = Season;

  export type GetSeasons = EnhancedSeason;

  export type GetResultsBySeasonId = {
    season: {
      id: number;
      name: string;
      start: string;
      end: string;
      wager_cap: number;
    };
    predictions: {
      closed: number;
      successes: number;
      failures: number;
    };
    bets: {
      closed: number;
      successes: number;
      failures: number;
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
    };
    largest_penalty: {
      value: number;
      prediction_id: number;
      better: {
        id: string;
        discord_id: string;
      };
    };
  };
}
