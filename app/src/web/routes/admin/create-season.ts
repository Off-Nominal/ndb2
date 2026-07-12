import type { PoolClient } from "pg";
import seasonsV2 from "@data/queries/seasons";
import { seasonsManager } from "@domain/seasons/season-manager";

export type CreateSeasonSuccess = {
  ok: true;
  season_id: number;
  season_name: string;
};

export type CreateSeasonFailure = {
  ok: false;
  message: string;
};

export type CreateSeasonResult = CreateSeasonSuccess | CreateSeasonFailure;

export type CreateSeasonInput = {
  name: string;
  start: Date;
  end: Date;
  payout_formula: string;
};

/** Half-open overlap check against existing seasons. */
function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

/**
 * Insert a new season and refresh the seasons cache.
 * Assumes request fields were already validated (non-empty name/formula, start before end).
 */
export async function createSeason(
  dbClient: PoolClient,
  input: CreateSeasonInput,
): Promise<CreateSeasonResult> {
  const existing = await seasonsV2.getAll(dbClient)();
  const overlap = existing.find((season) =>
    rangesOverlap(
      input.start,
      input.end,
      new Date(season.start),
      new Date(season.end),
    ),
  );

  if (overlap) {
    return {
      ok: false,
      message: `Season window overlaps existing season “${overlap.name}” (#${overlap.id}).`,
    };
  }

  const created = await seasonsV2.add(dbClient)({
    name: input.name,
    start: input.start,
    end: input.end,
    payout_formula: input.payout_formula,
  });

  await seasonsManager.refreshSeasons(dbClient);

  return {
    ok: true,
    season_id: created.id,
    season_name: created.name,
  };
}
