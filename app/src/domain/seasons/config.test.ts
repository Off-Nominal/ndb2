import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockClient, withPoolClient, emit, refreshSeasons, getSeasonByIdentifier } =
  vi.hoisted(() => {
    const mockClient = {
      query: vi.fn(),
    };

    return {
      mockClient,
      withPoolClient: vi.fn((cb: (client: any) => Promise<void>) =>
        Promise.resolve(cb(mockClient)),
      ),
      emit: vi.fn(),
      refreshSeasons: vi.fn(),
      getSeasonByIdentifier: vi.fn(),
    };
  });

const search = vi.fn();
const getResultsById = vi.fn();
const closeById = vi.fn();

vi.mock("@domain/monitors/with-pool-client", () => ({
  withPoolClient,
}));

vi.mock("@domain/events/events-manager", () => ({
  eventsManager: { emit },
}));

vi.mock("@data/queries/predictions", () => ({
  default: {
    search: () => search,
  },
}));

vi.mock("@data/queries/seasons", () => ({
  default: {
    getResultsById: () => getResultsById,
    closeById: () => closeById,
  },
}));

vi.mock("./season-manager", () => ({
  seasonsManager: {
    refreshSeasons,
    getSeasonByIdentifier,
  },
}));

import { monitors } from "./config";

describe("seasons monitor config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.query.mockResolvedValue(undefined);
  });

  it("does nothing if last season is closed", async () => {
    getSeasonByIdentifier.mockReturnValueOnce({ id: 1, closed: true });

    const log = vi.fn();
    await monitors[0]!.callback(log);

    expect(refreshSeasons).toHaveBeenCalled();
    expect(search).not.toHaveBeenCalled();
    expect(getResultsById).not.toHaveBeenCalled();
    expect(closeById).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it("logs and exits if unresolved predictions remain", async () => {
    getSeasonByIdentifier.mockReturnValueOnce({ id: 7, closed: false });
    search.mockResolvedValueOnce([{ id: 123 }]);

    const log = vi.fn();
    await monitors[0]!.callback(log);

    expect(search).toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      "Season 7 still has unresolved predictions; not closing.",
    );
    expect(getResultsById).not.toHaveBeenCalled();
    expect(closeById).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it("closes season and emits season_end when no unresolved predictions remain", async () => {
    getSeasonByIdentifier.mockReturnValueOnce({ id: 9, closed: false });
    search.mockResolvedValueOnce([]);
    getResultsById.mockResolvedValueOnce({ season: { id: 9 } });
    closeById.mockResolvedValueOnce(null);

    const log = vi.fn();
    await monitors[0]!.callback(log);

    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(getResultsById).toHaveBeenCalledWith(9);
    expect(closeById).toHaveBeenCalledWith(9);
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(emit).toHaveBeenCalledWith("season_end", { season: { id: 9 } });
    expect(log).toHaveBeenCalledWith("Season results posted.");
  });

  it("rolls back if closing flow errors", async () => {
    getSeasonByIdentifier.mockReturnValueOnce({ id: 10, closed: false });
    search.mockResolvedValueOnce([]);
    getResultsById.mockResolvedValueOnce(null); // triggers throw in config.ts

    const log = vi.fn();
    await expect(monitors[0]!.callback(log)).rejects.toThrow(
      "No season results found for season 10",
    );

    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(emit).not.toHaveBeenCalled();
  });
});

