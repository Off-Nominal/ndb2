import type { Request, Response } from "express";
import { describe, expect, it } from "vitest";
import {
  getThemePreference,
  parseThemeCookie,
  themePreferenceMiddleware,
  THEME_COOKIE_NAME,
} from "./themePreferenceMiddleware";

describe("themePreferenceMiddleware (cookie parsing)", () => {
  it("parseThemeCookie returns system when header missing", () => {
    expect(parseThemeCookie(undefined)).toBe("system");
  });

  it("parseThemeCookie reads light and dark", () => {
    expect(parseThemeCookie(`${THEME_COOKIE_NAME}=light`)).toBe("light");
    expect(parseThemeCookie(`foo=1; ${THEME_COOKIE_NAME}=dark; bar=2`)).toBe(
      "dark",
    );
  });

  it("parseThemeCookie decodes encoded values", () => {
    expect(
      parseThemeCookie(`${THEME_COOKIE_NAME}=${encodeURIComponent("dark")}`),
    ).toBe("dark");
  });

  it("parseThemeCookie treats unknown values as system", () => {
    expect(parseThemeCookie(`${THEME_COOKIE_NAME}=nope`)).toBe("system");
  });
});

describe("getThemePreference (async local storage)", () => {
  it("returns system when called outside request context", () => {
    expect(getThemePreference()).toBe("system");
  });

  it("returns cookie value inside middleware chain", () => {
    const req = {
      headers: { cookie: `${THEME_COOKIE_NAME}=dark` },
    } as Request;
    const res = {} as Response;

    themePreferenceMiddleware(req, res, () => {
      expect(getThemePreference()).toBe("dark");
    });
  });
});
