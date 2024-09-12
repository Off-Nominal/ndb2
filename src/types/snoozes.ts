export namespace APISnoozes {
  export type SnoozeCheckResults = {
    trigger: number;
    day: number;
    week: number;
    month: number;
    quarter: number;
    year: number;
  };

  export type EnhancedSnoozeCheck = SnoozeCheck & {
    votes: SnoozeCheckResults;
  };

  export type SnoozeCheck = {
    id: number;
    prediction_id: number;
    check_date: string;
    closed: boolean;
    closed_at: string | null;
  };

  export type SnoozeVote = {
    snooze_check_id: number;
    user_id: number;
    value: number;
    created_at: string;
  };

  export enum SnoozeOptions {
    TRIGGER = 0,
    DAY = 1,
    WEEK = 7,
    MONTH = 30,
    QUARTER = 90,
    YEAR = 365,
  }

  export type AddSnoozeCheck = SnoozeCheck;

  export type GetSnoozeCheck = EnhancedSnoozeCheck;

  export type AddSnoozeVote = EnhancedSnoozeCheck;
}

export const isAllowableSnooze = (
  value: number
): value is APISnoozes.SnoozeOptions => {
  return Object.values(APISnoozes.SnoozeOptions).includes(value);
};
