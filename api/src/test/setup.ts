// Vitest global setup file
// This file runs before all tests and configures the environment for testing

// Set the DATABASE_URL to point to the test database
process.env.DATABASE_URL =
  "postgresql://test_user:test_password@localhost:5433/ndb2_test";

// You can add other test-specific environment variables here if needed
// For example:
// process.env.NODE_ENV = "test";
// process.env.LOG_LEVEL = "error";
