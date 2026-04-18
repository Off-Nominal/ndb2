import { describe, expect, it, vi } from "vitest";
import { delayed_snippet } from "./delayed_snippet";

describe("delayed_snippet", () => {
  it("resolves to HTML including label and delay after the wait", async () => {
    vi.useFakeTimers();
    const p = delayed_snippet({ delayMs: 100, label: "X" });
    await vi.advanceTimersByTimeAsync(100);
    const html = await p;
    vi.useRealTimers();

    expect(html).toContain('data-label="X"');
    expect(html).toContain("100");
    expect(html).toContain("suspense-loaded");
  });
});
