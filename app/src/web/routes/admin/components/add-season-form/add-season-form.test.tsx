import { describe, expect, it } from "vitest";
import { AddSeasonForm } from "./add-season-form";

describe("AddSeasonForm", () => {
  it("renders HTMX post attributes, loading indicator, and latest snapshot", () => {
    const html = AddSeasonForm({
      latestSeason: {
        id: 47,
        name: "Ignition",
        start: "2026-07-01T00:00:00.000Z",
        end: "2026-10-01T00:00:00.000Z",
        payout_formula: "(ln($1/$2/2.0)/1.3)+1",
      },
      name: "",
      start: "2026-10-01T00:00",
      end: "2027-01-01T00:00",
      payout_formula: "(ln($1/$2/2.0)/1.3)+1",
    });

    expect(html).toContain('hx-post="/admin/seasons"');
    expect(html).toContain('hx-target="#add-season-feedback"');
    expect(html).toContain('hx-indicator="#add-season-loading"');
    expect(html).toContain('hx-disabled-elt="#add-season-form"');
    expect(html).toContain('id="add-season-loading"');
    expect(html).toContain("Creating season…");
    expect(html).toContain("database triggers");
    expect(html).toContain("Latest");
    expect(html).toContain("Ignition");
    expect(html).toContain("#47");
    expect(html).not.toContain("wager_cap");
    expect(html).not.toContain("closed:");
    expect(html).toContain('name="name"');
    expect(html).toContain('name="start"');
    expect(html).toContain('name="end"');
    expect(html).toContain('type="datetime-local"');
    expect(html).toContain("Create season");
  });

  it("shows empty latest state when no seasons exist", () => {
    const html = AddSeasonForm({
      latestSeason: null,
      name: "",
      start: "2026-07-01T00:00",
      end: "2026-10-01T00:00",
      payout_formula: "(ln($1/$2/2.0)/1.3)+1",
    });

    expect(html).toContain("No seasons in the database yet.");
  });
});
