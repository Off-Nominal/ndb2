// Vitest global setup file
// This file runs once before all tests and configures the environment for testing

import { Client } from "pg";
import { reset } from "@offnominal/ndb2-db";
import { createLogger } from "../utils/logger";

const logger = createLogger("TEST");

// Set the DATABASE_URL to point to the test database
process.env.DATABASE_URL =
  "postgresql://test_user:test_password@localhost:5433/ndb2_test";

// Set the timezone to UTC
process.env.TZ = "UTC";

// You can add other test-specific environment variables here if needed
// For example:
process.env.NODE_ENV = "test";
// process.env.LOG_LEVEL = "error";

// Function to check if test database is running
async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Try to connect to the test database
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    return true;
  } catch (error) {
    logger.error("Failed to connect to test database:", error);
    throw new Error("Test database not accessible");
  }
}

// Function to reset the test database
export async function resetTestDatabase(
  client: Client = new Client({
    connectionString: process.env.DATABASE_URL,
  })
): Promise<void> {
  try {
    await reset(client, { verbose: false });
  } catch (error) {
    logger.error("Failed to reset test database:", error);
    throw error;
  }
}

async function setup() {
  // Check if test database is accessible
  await checkDatabaseConnection();

  // Reset the database to ensure clean state
  await resetTestDatabase();
}

export default setup;
