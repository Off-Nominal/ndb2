export namespace SnoozeVotes {
  /**
   * Allowed snooze vote values (duration in days). Matches the `snooze_votes.value`
   * CHECK constraint and legacy `APISnoozes.SnoozeOptions` numeric values.
   */
  export const SNOOZE_VOTE_VALUES = [1, 7, 30, 90, 365] as const;

  export type SnoozeVoteValue = (typeof SNOOZE_VOTE_VALUES)[number];

  const snoozeVoteValueSet: ReadonlySet<number> = new Set(SNOOZE_VOTE_VALUES);

  /** Runtime guard for {@link SnoozeVoteValue} (for clients and non-Zod validation). */
  export function isSnoozeVoteValue(n: unknown): n is SnoozeVoteValue {
    return typeof n === "number" && snoozeVoteValueSet.has(n);
  }
}
