import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLogger } from "./logging";

describe("createLogger", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("when verbose is true", () => {
    it("should log messages to console", () => {
      const logger = createLogger(true);
      const message = "Test message";

      logger(message);

      expect(consoleSpy).toHaveBeenCalledWith(message);
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("when verbose is false", () => {
    it("should not log messages to console", () => {
      const logger = createLogger(false);
      const message = "Test message";

      logger(message);

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});
