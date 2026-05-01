import { z } from "zod";
import { Endpoints } from "@offnominal/ndb2-api-types/v2";

/** Match Express `req.query` normalization used in API `queryParamScalar` (without importing the full validations module). */
function preprocessQueryStringScalar(value: unknown): unknown {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

const homeLeaderboardSortSchema = z.object({
  sort_by: z.preprocess(
    preprocessQueryStringScalar,
    z
      .enum(Endpoints.Results.CROSS_SCOPE_RESULTS_SORT_VALUES)
      .optional()
      .default("rank_points_net-desc"),
  ),
});

/** HTMX partial for {@link LeaderboardTable}; keep in sync with `Home` router registration. */
export const HOME_LEADERBOARD_HTMX_PATH = "/home/leaderboard";

export type HomeLeaderboardSortBy = Endpoints.Results.CrossScopeResultsSortBy;

export function parseHomeLeaderboardSortFromQuery(
  query: unknown,
): HomeLeaderboardSortBy {
  const parsed = homeLeaderboardSortSchema.safeParse(query);
  if (!parsed.success) return "rank_points_net-desc";
  return parsed.data.sort_by;
}

export function homeLeaderboardFragmentUrl(sortBy: HomeLeaderboardSortBy): string {
  const q = new URLSearchParams({ sort_by: sortBy });
  return `${HOME_LEADERBOARD_HTMX_PATH}?${q.toString()}`;
}

export function homeLeaderboardPageUrl(sortBy: HomeLeaderboardSortBy): string {
  const q = new URLSearchParams({ sort_by: sortBy });
  return `/?${q.toString()}`;
}
