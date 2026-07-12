import { addQuarters, startOfQuarter } from "date-fns";

/**
 * Reinterpret a Date’s UTC calendar/time fields as a local Date so date-fns
 * (which uses local getters/setters) can run UTC calendar math.
 */
function utcPartsAsLocal(date: Date): Date {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  );
}

/** Inverse of {@link utcPartsAsLocal}: treat local fields as UTC wall time. */
function localPartsAsUtc(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds(),
    ),
  );
}

/** Start of the UTC calendar quarter containing `date` (Jan/Apr/Jul/Oct, 00:00:00.000Z). */
export function utcStartOfQuarter(date: Date = new Date()): Date {
  return localPartsAsUtc(startOfQuarter(utcPartsAsLocal(date)));
}

/** Add `amount` UTC calendar quarters (default 1). */
export function addUtcQuarters(date: Date, amount: number = 1): Date {
  return localPartsAsUtc(addQuarters(utcPartsAsLocal(date), amount));
}

/**
 * UTC calendar quarter window for `date`: `[start, end)` where `end` is the start of the
 * next quarter (matches contiguous season boundaries like `2026-07-01` → `2026-10-01`).
 */
export function utcCalendarQuarterRange(date: Date = new Date()): {
  start: Date;
  end: Date;
} {
  const start = utcStartOfQuarter(date);
  return { start, end: addUtcQuarters(start, 1) };
}
