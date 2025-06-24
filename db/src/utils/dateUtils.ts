import { SeedDate } from "../types";
import { add } from "date-fns";

export function getQuarterDates(
  baseDate: Date,
  quarter: "last" | "current" | "next"
): { start: Date; end: Date } {
  const currentQuarter = Math.floor(baseDate.getUTCMonth() / 3);
  const currentYear = baseDate.getUTCFullYear();

  let targetQuarter: number;
  let targetYear: number;

  switch (quarter) {
    case "last":
      if (currentQuarter === 0) {
        targetQuarter = 3;
        targetYear = currentYear - 1;
      } else {
        targetQuarter = currentQuarter - 1;
        targetYear = currentYear;
      }
      break;
    case "current":
      targetQuarter = currentQuarter;
      targetYear = currentYear;
      break;
    case "next":
      if (currentQuarter === 3) {
        targetQuarter = 0;
        targetYear = currentYear + 1;
      } else {
        targetQuarter = currentQuarter + 1;
        targetYear = currentYear;
      }
      break;
  }

  const startMonth = targetQuarter * 3;
  const start = new Date(Date.UTC(targetYear, startMonth, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(targetYear, startMonth + 3, 1, 0, 0, 0, 0)); // Start of next quarter (exclusive)

  return { start, end };
}

export function resolveSeedDate(seedDate: SeedDate, baseDate: Date): Date {
  // If it's a string, treat it as an ISO timestamp
  if (typeof seedDate === "string") {
    return new Date(seedDate);
  }

  // If it's a complex object with quarter and offset
  const { quarter, days, hours = 0, minutes = 0, seconds = 0 } = seedDate;

  // Get the quarter start date
  const { start: quarterStart } = getQuarterDates(baseDate, quarter);

  // Add the offset from the quarter start
  const result = add(quarterStart, {
    days,
    hours,
    minutes,
    seconds,
  });

  return result;
}
