import { beforeEach, describe, expect, it, vi } from "vitest";

const getAll = vi.fn();
const add = vi.fn();
const refreshSeasons = vi.fn();

vi.mock("@data/queries/seasons", () => ({
  default: {
    getAll: () => getAll,
    add: () => add,
  },
}));

vi.mock("@domain/seasons/season-manager", () => ({
  seasonsManager: {
    refreshSeasons: (...args: unknown[]) => refreshSeasons(...args),
  },
}));

import { createSeason } from "./create-season";

const mockClient = {} as import("pg").PoolClient;

describe("createSeason", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAll.mockResolvedValue([]);
    refreshSeasons.mockResolvedValue(undefined);
  });

  it("inserts a season and refreshes the seasons cache", async () => {
    add.mockResolvedValueOnce({
      id: 48,
      name: "Ignition II",
      start: "2026-10-01T00:00:00.000Z",
      end: "2027-01-01T00:00:00.000Z",
      wager_cap: 92,
      closed: false,
    });

    const result = await createSeason(mockClient, {
      name: "Ignition II",
      start: new Date("2026-10-01T00:00:00.000Z"),
      end: new Date("2027-01-01T00:00:00.000Z"),
      payout_formula: "(ln($1/$2/2.0)/1.3)+1",
    });

    expect(result).toEqual({
      ok: true,
      season_id: 48,
      season_name: "Ignition II",
    });
    expect(add).toHaveBeenCalledWith({
      name: "Ignition II",
      start: new Date("2026-10-01T00:00:00.000Z"),
      end: new Date("2027-01-01T00:00:00.000Z"),
      payout_formula: "(ln($1/$2/2.0)/1.3)+1",
    });
    expect(refreshSeasons).toHaveBeenCalledWith(mockClient);
  });

  it("rejects overlapping windows", async () => {
    getAll.mockResolvedValueOnce([
      {
        id: 47,
        name: "Ignition",
        start: "2026-07-01T00:00:00.000Z",
        end: "2026-10-01T00:00:00.000Z",
        wager_cap: 92,
        closed: false,
        identifier: "current",
      },
    ]);

    const result = await createSeason(mockClient, {
      name: "Overlap",
      start: new Date("2026-09-01T00:00:00.000Z"),
      end: new Date("2026-12-01T00:00:00.000Z"),
      payout_formula: "(ln($1/$2/2.0)/1.3)+1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Ignition");
      expect(result.message).toContain("#47");
    }
    expect(add).not.toHaveBeenCalled();
  });
});
