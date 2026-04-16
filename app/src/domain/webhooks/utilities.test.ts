import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { generateResponse, notifySubscribers } from "./utilities";

const mockPrediction: API.Entities.Predictions.Prediction = {
  id: 1,
  predictor: { id: "u", discord_id: "d" },
  text: "hello",
  driver: "date",
  season_id: null,
  season_applicable: false,
  created_date: "2026-01-01T00:00:00.000Z",
  due_date: "2026-04-01T00:00:00.000Z",
  check_date: null,
  last_check_date: null,
  closed_date: null,
  triggered_date: null,
  triggerer: null,
  judged_date: null,
  retired_date: null,
  status: "open",
  bets: [],
  votes: [],
  checks: [],
  payouts: { endorse: 0, undorse: 0 },
};

describe("generateResponse", () => {
  it("returns payload with event_name, version 2, date, and data", () => {
    const data = { prediction: mockPrediction };
    const result = generateResponse("new_prediction", data);

    expect(result.event_name).toBe("new_prediction");
    expect(result.version).toBe(2);
    expect(result.data).toEqual(data);
    expect(result.date).toBeInstanceOf(Date);
  });
});

describe("notifySubscribers", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true, statusText: "OK" });
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs JSON to each subscriber URL with auth header", async () => {
    const payload = generateResponse("new_prediction", {
      prediction: mockPrediction,
    });

    notifySubscribers(
      ["https://a.example/hook", "https://b.example/hook"],
      payload,
      "test-key",
    );

    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));

    for (const call of mockFetch.mock.calls) {
      const [url, init] = call as [string, RequestInit];
      expect(["https://a.example/hook", "https://b.example/hook"]).toContain(
        url,
      );
      expect(init.method).toBe("POST");
      expect(init.headers).toMatchObject({
        "Content-Type": "application/json",
        Authorization: "Bearer test-key",
      });
      expect(JSON.parse(init.body as string)).toEqual({
        event_name: payload.event_name,
        version: payload.version,
        date: payload.date.toISOString(),
        data: payload.data,
      });
    }
  });

  it("does not call fetch when there are no subscribers", async () => {
    const payload = generateResponse("new_prediction", {
      prediction: mockPrediction,
    });

    notifySubscribers([], payload, "test-key");

    await Promise.resolve();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("logs and swallows non-ok responses", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockFetch.mockResolvedValue({ ok: false, statusText: "Bad Gateway" });

    const payload = generateResponse("new_prediction", {
      prediction: mockPrediction,
    });

    notifySubscribers(["https://x.example/hook"], payload, "test-key");

    await vi.waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());
    consoleErrorSpy.mockRestore();
  });

  it("logs and swallows fetch rejections", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockFetch.mockRejectedValue(new Error("network"));

    const payload = generateResponse("new_prediction", {
      prediction: mockPrediction,
    });

    notifySubscribers(["https://x.example/hook"], payload, "test-key");

    await vi.waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());
    consoleErrorSpy.mockRestore();
  });
});

