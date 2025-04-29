export namespace Seasons {
  export type Identifier = "current" | "past" | "future";

  type Season = {
    id: number;
    name: string;
    start: Date;
    end: Date;
    wager_cap: number;
    closed: boolean;
    identifier: Identifier;
  };

  export type GET = Season[];
}
