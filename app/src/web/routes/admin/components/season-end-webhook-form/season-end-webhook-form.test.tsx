import { describe, expect, it } from "vitest";
import { SeasonEndWebhookForm } from "./season-end-webhook-form";

describe("SeasonEndWebhookForm", () => {
  it("renders HTMX post attributes and feedback target", () => {
    const html = SeasonEndWebhookForm({
      seasons: [
        {
          id: 3,
          name: "Q1 2024",
          start: "2024-01-01T00:00:00.000Z",
          end: "2024-04-01T00:00:00.000Z",
          wager_cap: 90,
          closed: true,
          identifier: "past",
        },
      ],
      selectedSeasonId: "3",
    });

    expect(html).toContain('hx-post="/admin/season-end-event"');
    expect(html).toContain('hx-target="#season-end-webhook-feedback"');
    expect(html).toContain('hx-indicator="#season-end-webhook-loading"');
    expect(html).toContain('id="season-end-webhook-feedback"');
    expect(html).toContain('name="season_id"');
    expect(html).toContain("Re-send webhook");
  });

  it("shows empty state when no eligible seasons exist", () => {
    const html = SeasonEndWebhookForm({
      seasons: [],
      selectedSeasonId: "",
    });

    expect(html).toContain("No past closed seasons are available.");
    expect(html).not.toContain("hx-post=");
  });
});
