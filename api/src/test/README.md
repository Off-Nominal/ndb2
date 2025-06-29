# Database Transaction Mock Utility

This utility provides automatic transaction wrapping for database operations in tests, ensuring better isolation between parallel test runs.

## Overview

The `db-transaction-mock.ts` utility mocks `pool.connect()` to automatically wrap all database operations in transactions that are rolled back when the client is released. This provides several benefits:

- **Better test isolation**: Each test runs in its own transaction
- **Automatic cleanup**: No need to manually clean up test data
- **Parallel test support**: Tests can run simultaneously without interference
- **Simplified test code**: No need to manage transactions manually

## Usage

### Basic Usage

```typescript
import { useDbTransactionMock } from "./test/db-transaction-mock";

// Enable transaction wrapping for all tests in this file
useDbTransactionMock();

describe("My Test Suite", () => {
  it("should work with database operations", async () => {
    const client = await pool.connect();

    try {
      // All operations are automatically wrapped in a transaction
      await client.query("INSERT INTO users (name) VALUES ($1)", ["Test User"]);

      // Verify the operation worked
      const result = await client.query("SELECT * FROM users WHERE name = $1", [
        "Test User",
      ]);
      expect(result.rows).toHaveLength(1);
    } finally {
      // Transaction is automatically rolled back when client is released
      await client.release();
    }
  });
});
```

### Manual Setup/Teardown

If you prefer manual control:

```typescript
import {
  setupDbTransactionMock,
  teardownDbTransactionMock,
} from "./test/db-transaction-mock";

describe("My Test Suite", () => {
  beforeEach(() => {
    setupDbTransactionMock();
  });

  afterEach(() => {
    teardownDbTransactionMock();
  });

  // ... your tests
});
```

### Manual Transaction Control

For tests that need explicit transaction control:

```typescript
import {
  startTransaction,
  commitTransaction,
  rollbackTransaction,
} from "./test/db-transaction-mock";

it("should handle manual transaction control", async () => {
  const client = await pool.connect();

  try {
    await startTransaction(client);

    // Your database operations here

    // Optionally commit if you want to persist changes
    await commitTransaction(client);

    // Or rollback manually
    // await rollbackTransaction(client);
  } finally {
    await client.release();
  }
});
```

## How It Works

1. **Mock Setup**: The utility mocks `pool.connect()` to return a wrapped client
2. **Transaction Wrapping**: The first query on the client automatically starts a `BEGIN` transaction
3. **Automatic Rollback**: When `client.release()` is called, a `ROLLBACK` is automatically executed
4. **Proxy Pattern**: All other PoolClient methods are forwarded to the original client

## Integration with Existing Code

This utility works seamlessly with your existing code because:

- It uses the same `pool.connect()` interface
- The `getDbClient` middleware continues to work unchanged
- All existing database operations remain compatible
- The transaction wrapping is transparent to your application code

## Best Practices

1. **Always use try/finally**: Ensure clients are released even if tests fail
2. **Don't rely on data persistence**: Each test should be self-contained
3. **Use descriptive test data**: Make test data unique to avoid conflicts
4. **Test isolation**: Each test should be able to run independently

## Example with Route Handlers

```typescript
import { useDbTransactionMock } from "./test/db-transaction-mock";
import request from "supertest";
import express from "express";

useDbTransactionMock();

describe("User API", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    // Setup your routes here
  });

  it("should create a user", async () => {
    const response = await request(app)
      .post("/users")
      .send({ name: "Test User", email: "test@example.com" });

    expect(response.status).toBe(201);

    // The user creation is automatically rolled back after the test
  });

  it("should not find the user from previous test", async () => {
    const response = await request(app).get("/users?email=test@example.com");

    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(0); // User was rolled back
  });
});
```

## Troubleshooting

### Tests Still Interfering

If tests are still interfering with each other:

1. Ensure you're calling `useDbTransactionMock()` at the top level of your test file
2. Check that all database clients are being properly released
3. Verify that your test database is properly isolated

### Transaction Errors

If you see transaction-related errors:

1. Make sure the database supports transactions
2. Check that you're not mixing transaction and non-transaction operations
3. Ensure proper error handling in your tests

### Performance Issues

For large test suites, consider:

1. Using database snapshots for faster resets
2. Grouping related tests to minimize transaction overhead
3. Using test data factories for consistent setup
