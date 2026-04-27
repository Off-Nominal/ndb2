import { describe, expect, it } from "vitest";
import { mergeClass } from "./merge_class";

describe("mergeClass", () => {
  it("returns base when extra is undefined or empty", () => {
    expect(mergeClass("[ foo ]", undefined)).toBe("[ foo ]");
    expect(mergeClass("[ foo ]", "")).toBe("[ foo ]");
  });

  it("concatenates when extra is non-empty", () => {
    expect(mergeClass("[ block ]", "[ is-active ]")).toBe("[ block ] [ is-active ]");
  });
});
