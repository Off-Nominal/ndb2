/** Render a leaderboard rank digit or em dash when unknown. */
export function formatRank(value: number | null): string {
  return value != null ? String(value) : "—";
}

/** Prediction pipeline breadth: open + closed + checking buckets. */
export function predictionOpenPipeline(p: {
  open: number;
  closed: number;
  checking: number;
}): number {
  return p.open + p.closed + p.checking;
}
