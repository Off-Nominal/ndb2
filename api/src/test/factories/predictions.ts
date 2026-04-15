import type { PredictionSeed } from "@offnominal/ndb2-db";
import * as C from "./constants";

/**
 * Build a `PredictionSeed` with safe defaults; override any field.
 * Typical: `prediction(1, { driver: "event", check_date: { days: 5 } })`.
 */
export function prediction(
  id: number,
  overrides: Partial<Omit<PredictionSeed, "id">> = {}
): PredictionSeed {
  return {
    id,
    user_id: C.USER_1_ID,
    text: "Test prediction",
    driver: "date",
    baseDate: { days: 0 },
    due: { days: 25 },
    ...overrides,
  };
}
