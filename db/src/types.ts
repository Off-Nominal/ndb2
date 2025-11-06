import * as API from "@offnominal/ndb2-api-types";

export type BaseSeedDate = string | RelativeSeedDate;

export type RelativeSeedDate = {
  quarter?: string;
  days?: number;
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
export interface SeasonSeed {
  name: string;
  payout_formula: string;
  quarter?: string; // For relative seasons
  start?: string; // ISO date string for legacy seasons
  end?: string; // ISO date string for legacy seasons
}

export const isValidQuarter = (
  quarter: string
): quarter is API.Entities.Seasons.Identifier => {
  return ["past", "current", "future"].includes(quarter);
};

export const isValidDriver = (
  driver: string
): driver is API.Entities.Predictions.PredictionDriver => {
  return ["date", "event"].includes(driver);
};

// Bet seed data type
export interface BetSeed {
  user_id: string;
  created: RelativeSeedDate;
  endorsed: boolean;
}

// Vote seed data type
export interface VoteSeed {
  user_id: string;
  voted: RelativeSeedDate; // Hours offset from now
  vote: boolean;
}

// Snooze vote seed data type
export interface SnoozeVoteSeed {
  user_id: string;
  value: number; // 1, 7, 30, 90, or 365
  created: RelativeSeedDate;
}

// Snooze check seed data type
export interface SnoozeCheckSeed {
  checked: RelativeSeedDate;
  closed?: RelativeSeedDate;
  values?: SnoozeVoteSeed[];
}

// Prediction seed data type
export interface PredictionSeed {
  id: number;
  user_id: string;
  text: string;
  driver: string;
  baseDate: BaseSeedDate;
  due?: RelativeSeedDate;
  check_date?: RelativeSeedDate;
  closed?: RelativeSeedDate;
  retired?: RelativeSeedDate;
  triggered?: RelativeSeedDate;
  judged?: RelativeSeedDate;
  checks?: SnoozeCheckSeed[];
  triggerer?: string;
  bets?: BetSeed[];
  votes?: VoteSeed[];
}
