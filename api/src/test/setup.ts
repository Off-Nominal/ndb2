import { beforeAll, afterAll } from "vitest";
import { Client } from "pg";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://test_user:test_password@localhost:5433/ndb2_test";

let dbClient: Client;

beforeAll(async () => {
  console.log("Setting up test database connection...");

  // Set test environment
  process.env.NODE_ENV = "test";
  process.env.TEST_DATABASE_URL = TEST_DB_URL;

  // Test database connection
  dbClient = new Client({
    connectionString: TEST_DB_URL,
  });

  try {
    await dbClient.connect();
    console.log("✅ Test database connection established");

    // Verify we can query the database
    const result = await dbClient.query("SELECT 1 as test");
    if (result.rows[0].test !== 1) {
      throw new Error("Database query test failed");
    }
    console.log("✅ Test database is responsive");
  } catch (error) {
    console.error("❌ Failed to connect to test database:", error);
    console.error(
      "Make sure the test database is running with: pnpm test:db:start"
    );
    throw error;
  }
}, 30000); // 30 second timeout

afterAll(async () => {
  if (dbClient) {
    await dbClient.end();
    console.log("Test database connection closed");
  }
});

// Export for use in tests
export { dbClient, TEST_DB_URL };
