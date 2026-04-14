import users from "./fixtures/users.json" with { type: "json" };
import seasons from "./fixtures/seasons.json" with { type: "json" };
import predictions from "./fixtures/predictions.json" with { type: "json" };
import type { PredictionSeed, SeasonSeed, UserSeed } from "@offnominal/ndb2-db";

/** Same dataset as the former db package test seeds, used for API integration tests. */
export const integrationSeed: {
  users: UserSeed[];
  seasons: SeasonSeed[];
  predictions: PredictionSeed[];
} = { users, seasons, predictions };
