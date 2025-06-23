// Vitest global setup file
// This file runs once before all tests and configures the environment for testing

import { execSync } from "child_process";
import path from "path";
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
    return false;
  }
}

// Function to reset the test database
export async function resetTestDatabase(): Promise<void> {
  try {
    console.log("Resetting test database using db package...");

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await reset(client);

    console.log("Test database reset completed successfully");
  } catch (error) {
    console.error("Failed to reset test database:", error);
    throw error;
  }
}

export default async function globalSetup() {
  console.log("Setting up test environment...");

  // Check if test database is accessible
  const isConnected = await checkDatabaseConnection();

  if (!isConnected) {
    console.log("Test database not accessible, attempting to start it...");
    throw new Error("Test database not accessible");
  }

  // Reset the database to ensure clean state
  await resetTestDatabase();

  console.log("Test environment setup completed successfully");
}
