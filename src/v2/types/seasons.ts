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

  // export type EnhancedSeason = Season & {
  //   identifier: "current" | "past" | "future";
  // };

  // export type GetSeasonByIdentifier = Season;

  // export type GetSeasons = EnhancedSeason;

  // export type GetResultsBySeasonId = {
  //   season: {
  //     id: number;
  //     name: string;
  //     start: string;
  //     end: string;
  //     wager_cap: number;
  //   };
  //   predictions: {
  //     closed: number;
  //     successes: number;
  //     failures: number;
  //   };
  //   bets: {
  //     closed: number;
  //     successes: number;
  //     failures: number;
  //   };
  //   scores: {
  //     payouts: number;
  //     penalties: number;
  //   };
  //   largest_payout: {
  //     value: number;
  //     prediction_id: number;
  //     better: {
  //       id: string;
  //       discord_id: string;
  //     };
  //   };
  //   largest_penalty: {
  //     value: number;
  //     prediction_id: number;
  //     better: {
  //       id: string;
  //       discord_id: string;
  //     };
  //   };
  // };

  // export type CloseSeasonById = {
  //   id: number;
  // };
}
