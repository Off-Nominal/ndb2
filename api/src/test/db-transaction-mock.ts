import { vi, beforeEach, afterEach } from "vitest";
import { PoolClient } from "pg";
import pool from "../db";

/**
 * A mock PoolClient that wraps operations in a transaction
 * All operations are automatically rolled back when the client is released
 */
class MockTransactionClient {
  private originalClient: PoolClient;
  private transactionStarted = false;

  constructor(client: PoolClient) {
    this.originalClient = client;
  }

  async query(text: string, values?: any[]): Promise<any> {
    // Start transaction on first query if not already started
    if (!this.transactionStarted) {
      await this.originalClient.query("BEGIN");
      this.transactionStarted = true;
    }

    return this.originalClient.query(text, values);
  }

  async release(): Promise<void> {
    if (this.transactionStarted) {
      try {
        await this.originalClient.query("ROLLBACK");
      } catch (error) {
        // Log rollback errors but don't throw - the test might have already failed
        console.warn("Error during transaction rollback:", error);
      }
    }

    return this.originalClient.release();
  }

  // Delegate all other method calls to the original client
  get [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.originalClient;
  }
}

// Create a proxy to forward all other method calls to the original client
function createTransactionClientProxy(originalClient: PoolClient): PoolClient {
  const mockClient = new MockTransactionClient(originalClient);

  return new Proxy(mockClient as any, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      // Forward all other properties/methods to the original client
      return (originalClient as any)[prop];
    },
  });
}

/**
 * Sets up the database transaction mock for tests
 * This should be called in beforeEach() of your test suite
 */
export function setupDbTransactionMock(): void {
  const originalConnect = pool.connect.bind(pool);

  vi.spyOn(pool, "connect").mockImplementation(async () => {
    const originalClient = await originalConnect();
    return createTransactionClientProxy(originalClient);
  });
}

/**
 * Restores the original pool.connect() method
 * This should be called in afterEach() of your test suite
 */
export function teardownDbTransactionMock(): void {
  vi.restoreAllMocks();
}

/**
 * Convenience function to set up and tear down the transaction mock
 * Use this in your test files for automatic setup/teardown
 */
export function useDbTransactionMock(): void {
  beforeEach(() => {
    setupDbTransactionMock();
  });

  afterEach(() => {
    teardownDbTransactionMock();
  });
}

/**
 * Manually start a transaction (useful for tests that need explicit control)
 * @param client The database client
 */
export async function startTransaction(client: PoolClient): Promise<void> {
  await client.query("BEGIN");
}

/**
 * Manually commit a transaction (useful for tests that need explicit control)
 * @param client The database client
 */
export async function commitTransaction(client: PoolClient): Promise<void> {
  await client.query("COMMIT");
}

/**
 * Manually rollback a transaction (useful for tests that need explicit control)
 * @param client The database client
 */
export async function rollbackTransaction(client: PoolClient): Promise<void> {
  await client.query("ROLLBACK");
}
