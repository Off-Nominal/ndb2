import { describe, it, expect, vi, beforeEach } from "vitest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { notifySeasonEndWebhook } from "@domain/webhooks/notify-season-end-webhook";

const getById = vi.fn();
const getResultsById = vi.fn();

vi.mock("@data/queries/seasons", () => ({
  default: {
    getById: () => getById,
    getResultsById: () => getResultsById,
  },
}));

vi.mock("@domain/webhooks/notify-season-end-webhook", () => ({
  notifySeasonEndWebhook: vi.fn(),
}));

vi.mock("@domain/events/events-manager", () => ({
  eventsManager: { emit: vi.fn() },
}));

import { eventsManager } from "@domain/events/events-manager";
import { resendSeasonEndWebhook } from "./resend-season-end-webhook";

const mockClient = {} as import("pg").PoolClient;

const pastClosedSeason = {
  id: 3,
  name: "Q1 2024",
  start: "2024-01-01T00:00:00.000Z",
  end: "2024-04-01T00:00:00.000Z",
  wager_cap: 90,
  closed: true,
  identifier: "past" as const,
  predictions: {
    open: 0,
    checking: 0,
    closed: 0,
    successful: 0,
    failed: 0,
    retired: 0,
  },
};

describe("resendSeasonEndWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("notifies webhook subscribers for an eligible season", async () => {
    getById.mockResolvedValueOnce(pastClosedSeason);
    const results = { season: pastClosedSeason, predictions: {}, bets: {}, scores: {} };
    getResultsById.mockResolvedValueOnce(results);

    const result = await resendSeasonEndWebhook(mockClient, { season_id: 3 });

    expect(result).toEqual({
      ok: true,
      season_id: 3,
      season_name: "Q1 2024",
    });
    expect(notifySeasonEndWebhook).toHaveBeenCalledWith(results);
    expect(eventsManager.emit).not.toHaveBeenCalled();
  });

  it("returns SEASON_NOT_FOUND when season is missing", async () => {
    getById.mockResolvedValueOnce(null);

    const result = await resendSeasonEndWebhook(mockClient, { season_id: 99 });

    expect(result).toEqual({
      ok: false,
      code: API.Errors.SEASON_NOT_FOUND,
      message: "Season 99 was not found.",
    });
    expect(notifySeasonEndWebhook).not.toHaveBeenCalled();
  });

  it("rejects seasons that are not past and closed", async () => {
    getById.mockResolvedValueOnce({
      ...pastClosedSeason,
      closed: false,
    });

    const result = await resendSeasonEndWebhook(mockClient, { season_id: 3 });

    expect(result).toEqual({
      ok: false,
      code: API.Errors.MALFORMED_BODY_DATA,
      message: "Only past closed seasons can have their end webhook re-sent.",
    });
    expect(notifySeasonEndWebhook).not.toHaveBeenCalled();
  });

  it("returns SEASON_NOT_FOUND when results are missing", async () => {
    getById.mockResolvedValueOnce(pastClosedSeason);
    getResultsById.mockResolvedValueOnce(null);

    const result = await resendSeasonEndWebhook(mockClient, { season_id: 3 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(API.Errors.SEASON_NOT_FOUND);
    }
    expect(notifySeasonEndWebhook).not.toHaveBeenCalled();
  });
});
