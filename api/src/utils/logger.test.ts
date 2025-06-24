import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Logger, createLogger } from "./logger";

describe("Logger", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should convert code to uppercase", () => {
      const logger = new Logger("sm");
      expect(logger["code"]).toBe("SM");
    });
  });

  describe("logging methods", () => {
    it("should log when NODE_ENV is not test", () => {
      process.env.NODE_ENV = "development";
      const logger = new Logger("SM");

      logger.log("Test message");
      logger.error("Test error");
      logger.warn("Test warning");
      logger.debug("Test debug");

      expect(console.log).toHaveBeenCalledWith("[SM]: Test message");
      expect(console.error).toHaveBeenCalledWith("[SM]: Test error");
      expect(console.warn).toHaveBeenCalledWith("[SM]: Test warning");
      expect(console.debug).toHaveBeenCalledWith("[SM]: Test debug");
    });

    it("should not log when NODE_ENV is test", () => {
      process.env.NODE_ENV = "test";
      const logger = new Logger("SM");

      logger.log("Test message");
      logger.error("Test error");
      logger.warn("Test warning");
      logger.debug("Test debug");

      expect(console.log).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
    });

    it("should handle additional arguments", () => {
      process.env.NODE_ENV = "development";
      const logger = new Logger("SM");
      const error = new Error("Test error");

      logger.error("Error occurred", error);

      expect(console.error).toHaveBeenCalledWith("[SM]: Error occurred", error);
    });
  });
});
