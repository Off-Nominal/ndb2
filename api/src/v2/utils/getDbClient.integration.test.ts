import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import { EventEmitter } from "events";
import { getDbClient } from "./getDbClient";
import pool from "../../db";

describe("getDbClient", () => {
  let mockRes: Response;

  beforeEach(() => {
    // Create a mock response that extends EventEmitter
    mockRes = new EventEmitter() as unknown as Response;
  });

  it("should return a real database client from pool.connect()", async () => {
    const connectSpy = vi.spyOn(pool, "connect");
    const client = await getDbClient(mockRes);
    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(client).toBeDefined();
    expect(client).toHaveProperty("query");
    expect(typeof client.query).toBe("function");

    // Clean up
    connectSpy.mockRestore();
    mockRes.emit("finish");
  });

  it("should call client.release() when res emits 'finish' event", async () => {
    const client = await getDbClient(mockRes);
    const releaseSpy = vi.spyOn(client, "release");

    // Verify release hasn't been called yet
    expect(releaseSpy).not.toHaveBeenCalled();

    // Emit the finish event
    mockRes.emit("finish");

    // Verify release was called
    expect(releaseSpy).toHaveBeenCalledTimes(1);

    releaseSpy.mockRestore();
  });

  it("should handle client release even if an error occurs", async () => {
    const client = await getDbClient(mockRes);
    const releaseSpy = vi.spyOn(client, "release");

    // Simulate an error scenario - the client should still be released
    try {
      await client.query("SELECT * FROM nonexistent_table_12345");
    } catch (error) {
      // Expected error
    }

    // Emit finish - should still release
    mockRes.emit("finish");
    expect(releaseSpy).toHaveBeenCalledTimes(1);

    releaseSpy.mockRestore();
  });
});
