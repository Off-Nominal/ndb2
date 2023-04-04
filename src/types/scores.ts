export namespace APIScores {
  export type Leader = {
    id: string;
    discord_id: string;
    rank: number;
    points?: number;
    predictions?: {
      successful: number;
      unsuccessful: number;
      total: number;
    };
    bets?: {
      successful: number;
      unsuccessful: number;
      total: number;
    };
  };

  export type GetLeaderboard = {
    type: "points" | "predictions" | "bets";
    season?: {
      id: number;
      name: string;
      start: string;
      end: string;
    };
    leaders: Leader[];
  };
}
