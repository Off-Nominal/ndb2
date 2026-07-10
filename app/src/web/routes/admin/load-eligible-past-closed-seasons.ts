import type { PoolClient } from "pg";
import type * as API from "@offnominal/ndb2-api-types/v2";
import seasonsV2 from "@data/queries/seasons";

/** Past seasons that are already closed — eligible for webhook re-send. */
export async function loadEligiblePastClosedSeasons(
  dbClient: PoolClient,
): Promise<API.Entities.Seasons.Season[]> {
  const all = await seasonsV2.getAll(dbClient)();
  return all.filter(
    (season) => season.identifier === "past" && season.closed,
  );
}
