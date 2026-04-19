import { describe, expect, it } from "vitest";
import { LuckyNumber } from "./lucky_number";

describe("LuckyNumber", () => {
  it("renders the value in a span", () => {
    expect(LuckyNumber({ value: 42 })).toBe(
      '<span class="lucky-number">42</span>',
    );
  });
});
