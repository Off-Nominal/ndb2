import type { SeasonSeed } from "@offnominal/ndb2-db";
import { DEFAULT_PAYOUT_FORMULA } from "./constants";

/**
 * One season row. Defaults: payout formula only; set `quarter` for relative seasons
 * or `start` / `end` for fixed dates.
 */
export function makeSeason(
  overrides: Partial<SeasonSeed> & Pick<SeasonSeed, "name">
): SeasonSeed {
  return {
    payout_formula: DEFAULT_PAYOUT_FORMULA,
    ...overrides,
  };
}

/** Past / current / future relative seasons (typical route tests). */
export function defaultPastCurrentFutureSeasons(): SeasonSeed[] {
  return [
    makeSeason({ name: "Past", quarter: "past" }),
    makeSeason({ name: "Present", quarter: "current" }),
    makeSeason({ name: "Future", quarter: "future" }),
  ];
}
