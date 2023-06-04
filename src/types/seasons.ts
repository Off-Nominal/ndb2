export namespace APISeasons {
  export type Season = {
    id: number;
    name: string;
    start: string;
    end: string;
    wager_cap: number;
  };

  export type GetSeasonByIdentifier = Season;

  export type GetSeasons = Season & {
    identifier: "current" | "past" | "future";
  };
}
