// Vitest setup file
// This file runs before each test file and configures the environment

import { execSync } from "child_process";
import path from "path";

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
    const { Client } = await import("pg");
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
async function resetTestDatabase(): Promise<void> {
  try {
    const testDbPath = path.resolve(__dirname, "../../../db/test-database");
    console.log("Resetting test database...");

    // Run the reset script
    execSync("./reset-test-db.sh", {
      cwd: testDbPath,
      stdio: "inherit",
      env: { ...process.env },
    });

    console.log("Test database reset completed successfully");
  } catch (error) {
    console.error("Failed to reset test database:", error);
    throw error;
  }
}

// Main setup function
export async function setup() {
  console.log("Setting up test environment...");

  // Check if test database is accessible
  const isConnected = await checkDatabaseConnection();

  if (!isConnected) {
    console.log("Test database not accessible, attempting to start it...");
    try {
      const testDbPath = path.resolve(__dirname, "../../../db/test-database");
      execSync("./start-test-db.sh", {
        cwd: testDbPath,
        stdio: "inherit",
        env: { ...process.env },
      });
    } catch (error) {
      console.error("Failed to start test database:", error);
      throw new Error(
        "Test database could not be started. Please ensure Docker is running and the test database setup is available."
      );
    }
  }

  // Reset the database to ensure clean state
  await resetTestDatabase();

  // Verify connection after reset
  const finalCheck = await checkDatabaseConnection();
  if (!finalCheck) {
    throw new Error("Test database is not accessible after reset");
  }

  console.log("Test environment setup completed successfully");
}

// Run setup if this file is executed directly
if (require.main === module) {
  setup().catch(console.error);
}
