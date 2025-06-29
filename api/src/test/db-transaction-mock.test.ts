import { describe, it, expect } from "vitest";
import { useDbTransactionMock } from "./db-transaction-mock";
import pool from "../db";
import { randomUUID } from "node:crypto";

// Enable the transaction mock for this test suite
useDbTransactionMock();

describe("Database Transaction Mock Example", () => {
  it("should wrap database operations in a transaction that gets rolled back", async () => {
    // Get a database client (this will be wrapped in a transaction)
    const client = await pool.connect();

    try {
      // Insert some test data
      await client.query("INSERT INTO users (id, discord_id) VALUES ($1, $2)", [
        randomUUID(),
        "test123",
      ]);

      // Verify the data was inserted (it should be visible within the transaction)
      const result = await client.query(
        "SELECT * FROM users WHERE discord_id = $1",
        ["test123"]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].discord_id).toBe("test123");
    } finally {
      // Release the client - this will automatically rollback the transaction
      await client.release();
    }
  });

  it("should not persist data between tests due to rollback", async () => {
    // Get a fresh client for this test
    const client = await pool.connect();

    try {
      // Try to find the data from the previous test - it should not exist
      const result = await client.query(
        "SELECT * FROM users WHERE discord_id = $1",
        ["test123"]
      );

      // The data should not exist because the previous test was rolled back
      expect(result.rows).toHaveLength(0);
    } finally {
      await client.release();
    }
  });

  it("should work with multiple queries in the same transaction", async () => {
    const client = await pool.connect();

    try {
      // Multiple operations within the same transaction
      await client.query("INSERT INTO users (id, discord_id) VALUES ($1, $2)", [
        randomUUID(),
        "user1",
      ]);

      await client.query("INSERT INTO users (id, discord_id) VALUES ($1, $2)", [
        randomUUID(),
        "user2",
      ]);

      // Update one of the users
      await client.query(
        "UPDATE users SET discord_id = $1 WHERE discord_id = $2",
        ["user3", "user1"]
      );

      // Verify all changes are visible within the transaction
      const result = await client.query(
        "SELECT * FROM users WHERE discord_id IN ($1, $2)",
        ["user3", "user2"]
      );

      expect(result.rows).toHaveLength(2);
    } finally {
      await client.release();
    }
  });
});
