import { describe, expect, it } from "vitest";
import { proposeNextSeason } from "./propose-next-season";

describe("proposeNextSeason", () => {
  it("proposes the contiguous next quarter after the latest season", () => {
    const proposal = proposeNextSeason({
      end: "2026-10-01T00:00:00.000Z",
      payout_formula: "(ln($1/$2/2.0)/1.3)+1",
    });

    expect(proposal.start.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(proposal.end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    expect(proposal.payout_formula).toBe("(ln($1/$2/2.0)/1.3)+1");
  });

  it("falls back to the current UTC calendar quarter when empty", () => {
    const proposal = proposeNextSeason(
      null,
      new Date("2026-08-15T12:00:00.000Z"),
    );

    expect(proposal.start.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(proposal.end.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(proposal.payout_formula).toBe("(ln($1/$2/2.0)/1.3)+1");
  });
});
