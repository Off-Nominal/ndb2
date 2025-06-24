// Vitest global setup file
// This file runs once before all tests and configures the environment for testing

import { Client } from "pg";
import { reset } from "@offnominal/ndb2-db";

// Set the DATABASE_URL to point to the test database
process.env.DATABASE_URL =
  "postgresql://test_user:test_password@localhost:5433/ndb2_test";

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
    console.error("Failed to connect to test database:", error);
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
    console.log("Resetting test database using db package...");

    await reset(client, { verbose: false });

    console.log("Test database reset completed successfully");
  } catch (error) {
    console.error("Failed to reset test database:", error);
    throw error;
  }
}

export default async function setup() {
  console.log("Setting up test environment...");

  // Check if test database is accessible
  await checkDatabaseConnection();

  // Reset the database to ensure clean state
  await resetTestDatabase();

  console.log("Test environment setup completed successfully");
}
