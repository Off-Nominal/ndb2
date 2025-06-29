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
