import { BaseSeedDate, isValidQuarter } from "../types";
import { add } from "date-fns";
import * as API from "@offnominal/ndb2-api-types";

export function getQuarterDates(
  baseDate: Date,
  quarter: API.Entities.Seasons.Identifier
): { start: Date; end: Date } {
  const currentQuarter = Math.floor(baseDate.getUTCMonth() / 3);
  const currentYear = baseDate.getUTCFullYear();

  let targetQuarter: number;
  let targetYear: number;

  switch (quarter) {
    case "past":
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
    case "future":
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

export function resolveSeedDate(seedDate: BaseSeedDate, baseDate: Date): Date {
  // If it's a string, treat it as an ISO timestamp
  if (typeof seedDate === "string") {
    return new Date(seedDate);
  }

  // If it's a complex object with quarter and offset
  const { quarter, days = 0, hours = 0, minutes = 0, seconds = 0 } = seedDate;

  // If it has a quarter, get the quarter start date
  let result: Date;
  if (quarter) {
    if (!isValidQuarter(quarter)) {
      throw new Error(`Invalid quarter: ${quarter}`);
    }
    const { start } = getQuarterDates(baseDate, quarter);
    result = start;
  } else {
    // If no quarter, use the base date directly
    result = baseDate;
  }

  // Add the offset from the quarter start (or base date)
  result = add(result, {
    days,
    hours,
    minutes,
    seconds,
  });

  return result;
}
