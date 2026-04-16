import { APIBets } from "./bets";

export namespace APIUsers {
  export type User = {
    id: string;
    discord_id: string;
  };

  export type GetUserByDiscordId = User;

  export type AddUser = User;

  export type GetUserScoreByDiscordId = {
    season?: {
      id: number;
      name: string;
      start: string;
      end: string;
    };
    score: {
      points: number;
      rank: number;
    };
    predictions: {
      successful: number;
      failed: number;
      pending: number;
      retired: number;
      rank: number;
    };
    bets: {
      successful: number;
      failed: number;
      pending: number;
      retired: number;
      rank: number;
    };
    votes: {
      sycophantic: number;
      contrarian: number;
      pending: number;
    };
  };

  export type GetBetsByUserId = Omit<APIBets.Bet, "user_id">;
}
