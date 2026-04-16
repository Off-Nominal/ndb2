import { describe, it, expect, vi, beforeEach } from "vitest";
import schedule from "node-schedule";
import { createLogger } from "@mendahu/utilities";
import { MonitorRunner } from "./MonitorRunner";

vi.mock("node-schedule", () => ({
  default: {
    scheduleJob: vi.fn(),
  },
}));

vi.mock("@mendahu/utilities", () => ({
  createLogger: vi.fn(),
}));

describe("MonitorRunner", () => {
  const logger = {
    log: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createLogger).mockReturnValue(logger as any);
  });

  it("schedules each monitor and logs running message", () => {
    const callbackA = vi.fn().mockResolvedValue(undefined);
    const callbackB = vi.fn().mockResolvedValue(undefined);

    const runner = new MonitorRunner(
      [
        { name: "A", schedule: "* * * * *", callback: callbackA },
        { name: "B", schedule: "0 * * * *", callback: callbackB },
      ],
      { namespace: "T", runningMessage: "Runner running." },
    );

    runner.initiate();

    expect(vi.mocked(schedule.scheduleJob)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(schedule.scheduleJob)).toHaveBeenNthCalledWith(
      1,
      "* * * * *",
      expect.any(Function),
    );
    expect(vi.mocked(schedule.scheduleJob)).toHaveBeenNthCalledWith(
      2,
      "0 * * * *",
      expect.any(Function),
    );

    expect(logger.log).toHaveBeenCalledWith("Runner running.");
  });

  it("runs the monitor callback and forwards monitor log calls", async () => {
    const callback = vi.fn(async (log: (message: string) => void) => {
      log("hello");
    });

    const runner = new MonitorRunner(
      [{ name: "A", schedule: "* * * * *", callback }],
      { namespace: "T", runningMessage: "Runner running." },
    );

    runner.initiate();

    const scheduledFn = vi.mocked(schedule.scheduleJob).mock.calls[0]?.[1];
    expect(typeof scheduledFn).toBe("function");

    scheduledFn!(new Date());

    // Allow promise chain inside executeMonitorCallback to run.
    await Promise.resolve();

    expect(logger.log).toHaveBeenCalledWith("Running monitor: A");
    expect(callback).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith("hello");
  });

  it("logs an error if the monitor callback rejects", async () => {
    const err = new Error("boom");
    const callback = vi.fn(() => Promise.reject(err));

    const runner = new MonitorRunner(
      [{ name: "A", schedule: "* * * * *", callback }],
      { namespace: "T", runningMessage: "Runner running." },
    );

    runner.initiate();

    const scheduledFn = vi.mocked(schedule.scheduleJob).mock.calls[0]?.[1];
    scheduledFn!(new Date());

    await Promise.resolve();

    expect(logger.error).toHaveBeenCalledWith("Running monitor A failed", err);
  });
});

