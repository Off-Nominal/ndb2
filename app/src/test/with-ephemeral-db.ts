import { beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { seedFromData } from "@offnominal/ndb2-db";
import type { PredictionSeed, SeasonSeed, UserSeed } from "@offnominal/ndb2-db";
import { resetPoolForTests } from "@data/db";
import {
  createDatabaseFromTemplate,
  databaseUrlWithName,
  dropEphemeralDatabase,
  makeEphemeralDatabaseName,
} from "./ephemeral-db";

const BASE_URL =
  process.env.TEST_POSTGRES_BASE_URL ??
  "postgresql://test_user:test_password@localhost:5433/ndb2_test";

export interface EphemeralDbContext {
  databaseUrl: string;
  databaseName: string;
}

/**
 * Points DATABASE_URL at a fresh DB cloned from the schema template, runs seedFromData,
 * and tears down the database after the file's tests complete.
 */
export function useEphemeralDb(options: {
  users: UserSeed[];
  seasons: SeasonSeed[];
  predictions: PredictionSeed[];
  baseDate?: Date;
}): EphemeralDbContext {
  const ctx: EphemeralDbContext = {
    databaseUrl: "",
    databaseName: "",
  };

  beforeAll(async () => {
    ctx.databaseName = makeEphemeralDatabaseName();
    await createDatabaseFromTemplate(BASE_URL, ctx.databaseName);
    ctx.databaseUrl = databaseUrlWithName(BASE_URL, ctx.databaseName);
    process.env.DATABASE_URL = ctx.databaseUrl;
    await resetPoolForTests();

    const client = new Client({ connectionString: ctx.databaseUrl });
    await client.connect();
    try {
      await seedFromData(
        client,
        options.users,
        options.seasons,
        options.predictions,
        options.baseDate ?? new Date()
      );
    } finally {
      await client.end();
    }
  });

  afterAll(async () => {
    await resetPoolForTests();
    await dropEphemeralDatabase(BASE_URL, ctx.databaseName);
    process.env.DATABASE_URL = databaseUrlWithName(BASE_URL, "ndb2_test");
    await resetPoolForTests();
  });

  return ctx;
}
