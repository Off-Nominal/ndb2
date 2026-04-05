export const SNOOZE_VOTE_VALUES = [1, 7, 30, 90, 365] as const;

export type SnoozeVoteValue = (typeof SNOOZE_VOTE_VALUES)[number];
