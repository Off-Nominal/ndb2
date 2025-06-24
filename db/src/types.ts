export type SeedDate =
  | string
  | {
      quarter: "last" | "current" | "next";
      days: number;
      hours?: number;
      minutes?: number;
      seconds?: number;
    };

// User seed data type
export interface UserSeed {
  id: string;
  discord_id: string;
  notes?: string;
}

// Season seed data type
interface BaseSeasonSeed {
  name: string;
  payout_formula: string;
}

export type SeasonSeed = BaseSeasonSeed &
  (
    | {
        quarter: "last" | "current" | "next"; // For relative seasons
      }
    | {
        start: string; // ISO date string for legacy seasons
        end: string; // ISO date string for legacy seasons
      }
  );

// Bet seed data type
export interface BetSeed {
  user_id: string;
  created: SeedDate;
  endorsed: boolean;
}

// Vote seed data type
export interface VoteSeed {
  user_id: string;
  voted: SeedDate; // Hours offset from now
  vote: boolean;
}

// Prediction seed data type
export interface PredictionSeed {
  user_id: string;
  text: string;
  created: SeedDate; // Hours offset from now
  due: SeedDate; // Hours offset from now
  closed?: SeedDate; // Hours offset from now, null, or undefined
  retired?: SeedDate; // Hours offset from now, null, or undefined
  triggered?: SeedDate; // Hours offset from now, null, or undefined
  judged?: SeedDate; // Hours offset from now, null, or undefined
  triggerer?: string; // User ID of who triggered the prediction
  bets?: BetSeed[];
  votes?: VoteSeed[];
}
