import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  booleanStringSchema,
  preprocessQueryStringMulti,
  preprocessQueryStringScalar,
  queryParamMulti,
  queryParamScalar,
  optionalTrimmedStringSchema,
  seasonIdSchema,
} from "./index";

describe("preprocessQueryStringScalar", () => {
  it("maps empty inputs to undefined", () => {
    expect(preprocessQueryStringScalar(undefined)).toBeUndefined();
    expect(preprocessQueryStringScalar(null)).toBeUndefined();
    expect(preprocessQueryStringScalar("")).toBeUndefined();
  });

  it("uses first array element", () => {
    expect(preprocessQueryStringScalar(["a", "b"])).toBe("a");
  });

  it("passes through other values", () => {
    expect(preprocessQueryStringScalar("x")).toBe("x");
  });
});

describe("preprocessQueryStringMulti", () => {
  it("maps empty inputs to undefined", () => {
    expect(preprocessQueryStringMulti(undefined)).toBeUndefined();
    expect(preprocessQueryStringMulti("")).toBeUndefined();
  });

  it("wraps a single string in an array", () => {
    expect(preprocessQueryStringMulti("open")).toEqual(["open"]);
  });

  it("preserves arrays", () => {
    expect(preprocessQueryStringMulti(["a", "b"])).toEqual(["a", "b"]);
  });
});

describe("queryParamScalar / queryParamMulti", () => {
  it("parses scalar through inner schema", () => {
    const s = queryParamScalar(z.coerce.number().optional());
    expect(s.parse("3")).toBe(3);
    expect(s.parse(undefined)).toBeUndefined();
  });

  it("parses multi through inner schema", () => {
    const s = queryParamMulti(z.array(z.enum(["x", "y"])).optional());
    expect(s.parse(["x", "y"])).toEqual(["x", "y"]);
    expect(s.parse("x")).toEqual(["x"]);
  });

  it("coerces optional season_id through queryParamScalar", () => {
    const s = queryParamScalar(seasonIdSchema.optional());
    expect(s.parse(undefined)).toBeUndefined();
    expect(s.parse("")).toBeUndefined();
    expect(s.parse("12")).toBe(12);
  });

  it("interprets optional boolean query strings", () => {
    const s = queryParamScalar(booleanStringSchema.optional());
    expect(s.parse(undefined)).toBeUndefined();
    expect(s.parse("")).toBeUndefined();
    expect(s.parse("true")).toBe(true);
    expect(s.parse("false")).toBe(false);
  });

  it("optionalTrimmedStringSchema trims and drops whitespace-only", () => {
    const s = queryParamScalar(optionalTrimmedStringSchema);
    expect(s.parse(undefined)).toBeUndefined();
    expect(s.parse("")).toBeUndefined();
    expect(s.parse("  mars  ")).toBe("mars");
    expect(s.parse("   ")).toBeUndefined();
  });
});
