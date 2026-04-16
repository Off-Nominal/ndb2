import { describe, it, expect, vi, beforeEach } from "vitest";
import { SeasonManager } from "./SeasonManager";
import type * as API from "@offnominal/ndb2-api-types/v2";

const { emit, getAll } = vi.hoisted(() => ({
  emit: vi.fn(),
  getAll: vi.fn(),
}));

vi.mock("../events/eventsManager", () => ({
  eventsManager: { emit },
}));

vi.mock("../../data/queries/seasons", () => ({
  default: {
    getAll: () => getAll,
  },
}));

vi.mock("@mendahu/utilities", () => ({
  createLogger: () => ({ log: vi.fn(), error: vi.fn() }),
}));

function makeSeason(
  partial: Partial<API.Entities.Seasons.Season> & Pick<API.Entities.Seasons.Season, "id" | "identifier">,
): API.Entities.Seasons.Season {
  return {
    id: partial.id,
    name: partial.name ?? `Season ${partial.id}`,
    start: partial.start ?? new Date("2020-01-01").toISOString(),
    end: partial.end ?? new Date("2020-01-02").toISOString(),
    wager_cap: partial.wager_cap ?? 100,
    closed: partial.closed ?? false,
    identifier: partial.identifier,
  };
}

describe("SeasonManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refreshSeasons updates cache and emits season_start when current season changes", async () => {
    const sm = new SeasonManager();

    (sm as any).seasons = [
      makeSeason({ id: 1, identifier: "past" }),
      makeSeason({ id: 2, identifier: "current" }),
    ];

    const newCurrent = makeSeason({ id: 3, identifier: "current" });
    const newPast = makeSeason({ id: 2, identifier: "past" });
    getAll.mockResolvedValueOnce([newCurrent, newPast, makeSeason({ id: 4, identifier: "future" })]);

    await sm.refreshSeasons({} as any);

    expect(emit).toHaveBeenCalledWith("season_start", newCurrent);
    expect((sm as any).seasons).toHaveLength(3);
  });

  it("refreshSeasons does not emit season_start when current season is unchanged", async () => {
    const sm = new SeasonManager();

    const current = makeSeason({ id: 2, identifier: "current" });
    const past = makeSeason({ id: 1, identifier: "past" });
    (sm as any).seasons = [past, current];

    const newCurrent = makeSeason({ id: 2, identifier: "current" });
    const newPast = makeSeason({ id: 1, identifier: "past" });
    getAll.mockResolvedValueOnce([newCurrent, newPast]);

    await sm.refreshSeasons({} as any);

    expect(emit).not.toHaveBeenCalled();
  });
});

