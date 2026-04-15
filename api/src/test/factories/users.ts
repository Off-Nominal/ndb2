import type { UserSeed } from "@offnominal/ndb2-db";
import * as C from "./constants";

const DEFAULT_NOTES = "Test user";

/**
 * One user row. Defaults to the first test UUID / Discord ID; spread overrides win.
 */
export function makeUser(overrides: Partial<UserSeed> = {}): UserSeed {
  return {
    id: C.USER_1_ID,
    discord_id: C.DISCORD_1,
    notes: DEFAULT_NOTES,
    ...overrides,
  };
}

/** Three users (predictor + two bettors). */
export function defaultUsers(): UserSeed[] {
  return [
    makeUser({ id: C.USER_1_ID, discord_id: C.DISCORD_1 }),
    makeUser({ id: C.USER_2_ID, discord_id: C.DISCORD_2 }),
    makeUser({ id: C.USER_3_ID, discord_id: C.DISCORD_3 }),
  ];
}
