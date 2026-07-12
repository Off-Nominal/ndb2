import {
  addUtcQuarters,
  utcCalendarQuarterRange,
} from "@shared/dates";

export type NextSeasonProposal = {
  start: Date;
  end: Date;
  payout_formula: string;
};

const DEFAULT_PAYOUT_FORMULA = "(ln($1/$2/2.0)/1.3)+1";

/**
 * Propose the next contiguous season window after the latest season, or the current
 * UTC calendar quarter when the table is empty.
 */
export function proposeNextSeason(
  latest: { end: string; payout_formula: string } | null,
  now: Date = new Date(),
): NextSeasonProposal {
  if (latest == null) {
    const { start, end } = utcCalendarQuarterRange(now);
    return {
      start,
      end,
      payout_formula: DEFAULT_PAYOUT_FORMULA,
    };
  }

  const start = new Date(latest.end);
  return {
    start,
    end: addUtcQuarters(start),
    payout_formula: latest.payout_formula,
  };
}
