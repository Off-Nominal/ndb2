export namespace APIScores {
  export interface Leader {
    id: string;
    discord_id: string;
    rank: number;
  }

  export interface PointsLeader extends Leader {
    points: number | undefined;
  }

  export interface BetsLeader extends Leader {
    bets: {
      successful: number;
      unsuccessful: number;
      total: number | undefined;
    };
  }

  export interface PredictionsLeader extends Leader {
    predictions: {
      successful: number;
      unsuccessful: number;
      total: number | undefined;
    };
  }

  export type LeaderboardType = "points" | "predictions" | "bets";

  export type GetLeaderboard<T> = {
    type: LeaderboardType;
    season?: {
      id: number;
      name: string;
      start: string;
      end: string;
    };
    leaders: T[];
  };

  export type GetPointsLeaderboard = GetLeaderboard<PointsLeader>;
  export type GetBetsLeaderboard = GetLeaderboard<BetsLeader>;
  export type GetPredictionsLeaderboard = GetLeaderboard<PredictionsLeader>;
}
