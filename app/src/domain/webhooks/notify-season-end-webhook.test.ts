import { describe, it, expect, vi, beforeEach } from "vitest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { notifySeasonEndWebhook } from "./notify-season-end-webhook";
import { generateResponse, notifySubscribers } from "./utilities";

vi.mock("@config", () => ({
  config: {
    webhooks: { missionControlBaseUrl: "https://mission.example/bot" },
    api: { discordClientApiKey: "test-key" },
  },
}));

vi.mock("./utilities", () => ({
  generateResponse: vi.fn((event_name, data) => ({
    event_name,
    version: 2,
    date: new Date("2026-01-01T00:00:00.000Z"),
    data,
  })),
  notifySubscribers: vi.fn(),
}));

const mockResults: API.Entities.Seasons.SeasonResults = {
  season: {
    id: 3,
    name: "Q1 2024",
    start: "2024-01-01T00:00:00.000Z",
    end: "2024-04-01T00:00:00.000Z",
    wager_cap: 90,
    closed: true,
    identifier: "past",
  },
  predictions: { closed: 1, successes: 2, failures: 0 },
  bets: { closed: 3, successes: 4, failures: 0 },
  scores: { payouts: 100, penalties: 10 },
  largest_payout: null,
  largest_penalty: null,
};

describe("notifySeasonEndWebhook", () => {
  beforeEach(() => {
    vi.mocked(generateResponse).mockClear();
    vi.mocked(notifySubscribers).mockClear();
  });

  it("generates season_end payload and notifies subscribers", () => {
    notifySeasonEndWebhook(mockResults);

    expect(generateResponse).toHaveBeenCalledWith("season_end", {
      results: mockResults,
    });
    expect(notifySubscribers).toHaveBeenCalledWith(
      ["https://mission.example/bot/v2"],
      expect.objectContaining({ event_name: "season_end" }),
      "test-key",
    );
  });
});
