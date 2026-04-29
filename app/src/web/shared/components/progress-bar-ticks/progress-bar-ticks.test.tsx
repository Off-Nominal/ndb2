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

  it("shows a percentage caption and reflects it in aria-valuetext when showPercentLabel is set", () => {
    const html = ProgressBarTicks({
      value: 3,
      min: 0,
      max: 10,
      showPercentLabel: true,
      "aria-label": "Season",
    });
    expect(html).toContain('aria-valuetext="30%"');
    expect(html).toContain(">30%</");
  });

  it("renders the caption row when only min/max labels are set (no percent tab)", () => {
    const html = ProgressBarTicks({
      value: 50,
      minLabel: "Start",
      maxLabel: "End",
      "aria-label": "Range",
    });
    expect(html).toContain('progress-bar-ticks__caption-min');
    expect(html).toContain(">Start<");
    expect(html).toContain(">End<");
    expect(html).not.toContain("aria-valuetext");
    expect(html).not.toContain("progress-bar-ticks__figure-label");
  });
});
