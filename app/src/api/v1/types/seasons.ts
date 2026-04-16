export namespace APISeasons {
  type Season = {
    id: number;
    name: string;
    start: string;
    end: string;
    wager_cap: number;
    closed: boolean;
  };

  type EnhancedSeason = Season & {
    identifier: "current" | "past" | "future";
  };

  export type GetSeasons = EnhancedSeason;
}
