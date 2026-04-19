import { describe, expect, it } from "vitest";
import { DelayedSnippet } from "./delayed_snippet";

describe("DelayedSnippet", () => {
  it("resolves to HTML containing the label", async () => {
    const p = DelayedSnippet({ delayMs: 100, label: "X" });
    const html = await Promise.resolve(p);
    expect(html).toContain("suspense-loaded");
    expect(html).toContain("X");
  });
});
