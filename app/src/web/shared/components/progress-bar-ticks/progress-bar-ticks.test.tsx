import { describe, expect, it } from "vitest";
import { ProgressBarTicks } from "./progress-bar-ticks";

describe("ProgressBarTicks", () => {
  it("exposes a progressbar with clamped aria values for 0–100", () => {
    const html = ProgressBarTicks({
      value: 37.2,
      "aria-label": "Completion",
    });
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain('aria-valuenow="37"');
    expect(html).toContain('aria-label="Completion"');
  });

  it("maps value into a custom min–max range", () => {
    const html = ProgressBarTicks({
      value: 5,
      min: 0,
      max: 10,
      "aria-label": "Score",
    });
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="10"');
    expect(html).toContain('aria-valuenow="5"');
  });

  it("shows a percentage caption and reflects it in aria-valuetext when enabled", () => {
    const html = ProgressBarTicks({
      value: 3,
      min: 0,
      max: 10,
      showPercentage: true,
      "aria-label": "Season",
    });
    expect(html).toContain('aria-valuetext="30%"');
    expect(html).toContain(">30%</");
  });
});
