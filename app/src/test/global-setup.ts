// Vitest global setup: verify Postgres, build schema template for ephemeral DB tests

import "./install-test-env.js";
import { Client } from "pg";
import { createLogger } from "@mendahu/utilities";
import { isTest } from "@shared/utils";
import { rebuildSchemaTemplate } from "./ephemeral-db";

if (!isTest()) {
  throw new Error("Vitest global-setup: NODE_ENV must be test");
}

const logger = createLogger({ namespace: "TEST", env: ["test"] });

async function checkDatabaseConnection(): Promise<void> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    await client.query("SELECT 1");
  } catch (error) {
    logger.error("Failed to connect to test database:", error);
    throw new Error("Test database not accessible");
  } finally {
    await client.end();
  }
}

async function setup() {
  await checkDatabaseConnection();
  logger.log("Building schema template database for integration tests...");
  await rebuildSchemaTemplate(process.env.DATABASE_URL!);
}

export default setup;
