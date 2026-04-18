import { describe, expect, it } from "vitest";
import { lucky_number } from "./lucky_number";

describe("lucky_number", () => {
  it("renders the value in a span", () => {
    expect(lucky_number({ value: 42 })).toBe(
      '<span class="lucky-number">42</span>',
    );
  });
});
