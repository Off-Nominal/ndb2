import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextFunction } from "express";
import type { PoolClient } from "pg";
import { getDbClient } from "./getDbClient";
import pool from "../db";
import responseUtils from "../v2/utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";

// Mock the database pool
vi.mock("../db", () => ({
  default: {
    connect: vi.fn(),
  },
}));

// Mock the response utils
vi.mock("../v2/utils/response", () => ({
  default: {
    writeErrors: vi.fn(),
  },
}));

describe("getDbClient middleware", () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: NextFunction;
  let mockClient: Partial<PoolClient>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock client
    mockClient = {
      release: vi.fn(),
    };

    // Setup mock request
    mockRequest = {
      locals: {},
    };

    // Setup mock response
    mockResponse = {
      locals: {},
      on: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    // Setup mock next function
    mockNext = vi.fn();

    // Setup response utils mock
    vi.mocked(responseUtils.writeErrors).mockReturnValue({
      success: false,
      data: null,
      errors: [
        {
          code: API.Errors.SERVER_ERROR,
          message: "Unable to make database connection, request aborted.",
        },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("successful database connection", () => {
    it("should call pool.connect()", async () => {
      // Arrange
      (vi.mocked(pool.connect) as any).mockResolvedValue(mockClient);

      // Act
      getDbClient(mockRequest, mockResponse, mockNext);

      // Assert
      expect(vi.mocked(pool.connect)).toHaveBeenCalledTimes(1);
    });

    it("should set res.locals.dbClient when connection is successful", async () => {
      // Arrange
      (vi.mocked(pool.connect) as any).mockResolvedValue(mockClient);

      // Act
      getDbClient(mockRequest, mockResponse, mockNext);

      // Wait for the promise to resolve
      await new Promise(process.nextTick);

      // Assert
      expect(mockResponse.locals.dbClient).toBe(mockClient);
    });

    it("should call next() when connection is successful", async () => {
      // Arrange
      (vi.mocked(pool.connect) as any).mockResolvedValue(mockClient);

      // Act
      getDbClient(mockRequest, mockResponse, mockNext);

      // Wait for the promise to resolve
      await new Promise(process.nextTick);

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should set up client release on response finish", async () => {
      // Arrange
      (vi.mocked(pool.connect) as any).mockResolvedValue(mockClient);

      // Act
      getDbClient(mockRequest, mockResponse, mockNext);

      // Wait for the promise to resolve
      await new Promise(process.nextTick);

      // Assert
      expect(mockResponse.on).toHaveBeenCalledWith(
        "finish",
        expect.any(Function)
      );

      // Get the finish handler and call it
      const finishHandler = mockResponse.on.mock.calls[0][1];
      finishHandler();

      // Verify client.release() was called
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  describe("database connection error", () => {
    it("should handle connection errors correctly", async () => {
      // Arrange
      const mockError = new Error("Database connection failed");
      vi.mocked(pool.connect).mockRejectedValue(mockError);
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Act
      getDbClient(mockRequest, mockResponse, mockNext);

      // Wait for the promise to reject
      await new Promise(process.nextTick);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(mockError);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              code: API.Errors.SERVER_ERROR,
              message: "Unable to make database connection, request aborted.",
            }),
          ]),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should not call next() when there is an error", async () => {
      // Arrange
      const mockError = new Error("Database connection failed");
      vi.mocked(pool.connect).mockRejectedValue(mockError);
      vi.spyOn(console, "error").mockImplementation(() => {});

      // Act
      getDbClient(mockRequest, mockResponse, mockNext);

      // Wait for the promise to reject
      await new Promise(process.nextTick);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should not set res.locals.dbClient when there is an error", async () => {
      // Arrange
      const mockError = new Error("Database connection failed");
      vi.mocked(pool.connect).mockRejectedValue(mockError);
      vi.spyOn(console, "error").mockImplementation(() => {});

      // Act
      getDbClient(mockRequest, mockResponse, mockNext);

      // Wait for the promise to reject
      await new Promise(process.nextTick);

      // Assert
      expect(mockResponse.locals.dbClient).toBeUndefined();
    });
  });

  describe("response finish event handling", () => {
    it("should release client when response finishes", async () => {
      // Arrange
      (vi.mocked(pool.connect) as any).mockResolvedValue(mockClient);

      // Act
      getDbClient(mockRequest, mockResponse, mockNext);

      // Wait for the promise to resolve
      await new Promise(process.nextTick);

      // Get the finish handler and call it
      const finishHandler = mockResponse.on.mock.calls[0][1];
      finishHandler();

      // Assert
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it("should set up finish handler only once per request", async () => {
      // Arrange
      (vi.mocked(pool.connect) as any).mockResolvedValue(mockClient);

      // Act
      getDbClient(mockRequest, mockResponse, mockNext);

      // Wait for the promise to resolve
      await new Promise(process.nextTick);

      // Assert
      expect(mockResponse.on).toHaveBeenCalledTimes(1);
      expect(mockResponse.on).toHaveBeenCalledWith(
        "finish",
        expect.any(Function)
      );
    });
  });
});
