import type { SeasonSeed } from "@offnominal/ndb2-db";
import { DEFAULT_PAYOUT_FORMULA } from "./constants";

/** Past / current / future seasons used across route tests that need real season rows. */
export function standardSeasonsTriple(): SeasonSeed[] {
  return [
    { name: "Past", quarter: "past", payout_formula: DEFAULT_PAYOUT_FORMULA },
    {
      name: "Present",
      quarter: "current",
      payout_formula: DEFAULT_PAYOUT_FORMULA,
    },
    {
      name: "Future",
      quarter: "future",
      payout_formula: DEFAULT_PAYOUT_FORMULA,
    },
  ];
}
