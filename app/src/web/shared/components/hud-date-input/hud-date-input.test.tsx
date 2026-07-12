import { describe, expect, it } from "vitest";
import { HudDateInput } from "./hud-date-input";

describe("HudDateInput", () => {
  it("renders date mode with hidden native date input and custom trigger", () => {
    const html = HudDateInput({
      mode: "date",
      id: "start-date",
      name: "start",
      value: "2026-10-01",
    });

    expect(html).toContain('data-hud-date-input');
    expect(html).toContain('data-hud-date-mode="date"');
    expect(html).toContain('type="date"');
    expect(html).toContain('data-hud-date-native');
    expect(html).toContain('data-hud-date-trigger');
    expect(html).toContain('id="start-date"');
    expect(html).toContain('name="start"');
    expect(html).toContain('value="2026-10-01"');
    expect(html).toContain("2026-10-01");
    expect(html).toContain('data-hud-date-panel');
  });

  it("renders datetime mode as datetime-local native + panel", () => {
    const html = HudDateInput({
      mode: "datetime",
      id: "start-at",
      name: "start",
      value: "2026-10-01T00:00",
      required: true,
    });

    expect(html).toContain('data-hud-date-mode="datetime"');
    expect(html).toContain('type="datetime-local"');
    expect(html).toContain('value="2026-10-01T00:00"');
    expect(html).toContain("2026-10-01 00:00");
    expect(html).toContain("required");
  });

  it("forwards min, max, and aria attributes to the trigger", () => {
    const html = HudDateInput({
      mode: "date",
      id: "end",
      name: "end",
      min: "2026-01-01",
      max: "2027-01-01",
      "aria-label": "End date",
      "aria-describedby": "end-hint",
      "aria-invalid": "true",
    });

    expect(html).toContain('min="2026-01-01"');
    expect(html).toContain('max="2027-01-01"');
    expect(html).toContain('aria-label="End date"');
    expect(html).toContain('aria-describedby="end-hint"');
    expect(html).toContain('aria-invalid="true"');
  });
});
