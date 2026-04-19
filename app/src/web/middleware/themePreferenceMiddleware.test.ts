import type { Request, Response } from "express";
import { describe, expect, it } from "vitest";
import {
  getThemePreference,
  parseThemeCookie,
  themePreferenceMiddleware,
  THEME_COOKIE_CONFIG,
} from "./themePreferenceMiddleware";

describe("themePreferenceMiddleware (cookie parsing)", () => {
  it("parseThemeCookie returns system when header missing", () => {
    expect(parseThemeCookie(undefined)).toBe("system");
  });

  it("parseThemeCookie reads light and dark", () => {
    expect(parseThemeCookie(`${THEME_COOKIE_CONFIG.name}=light`)).toBe("light");
    expect(
      parseThemeCookie(`foo=1; ${THEME_COOKIE_CONFIG.name}=dark; bar=2`),
    ).toBe("dark");
  });

  it("parseThemeCookie decodes encoded values", () => {
    expect(
      parseThemeCookie(
        `${THEME_COOKIE_CONFIG.name}=${encodeURIComponent("dark")}`,
      ),
    ).toBe("dark");
  });

  it("parseThemeCookie treats unknown values as system", () => {
    expect(parseThemeCookie(`${THEME_COOKIE_CONFIG.name}=nope`)).toBe("system");
  });
});

describe("getThemePreference (async local storage)", () => {
  it("returns system when called outside request context", () => {
    expect(getThemePreference()).toBe("system");
  });

  it("returns cookie value inside middleware chain", () => {
    const req = {
      headers: { cookie: `${THEME_COOKIE_CONFIG.name}=dark` },
    } as Request;
    const setCookies: string[] = [];
    const res = {
      append(name: string, value: string) {
        if (name.toLowerCase() === "set-cookie") setCookies.push(value);
      },
    } as unknown as Response;

    themePreferenceMiddleware(req, res, () => {
      expect(getThemePreference()).toBe("dark");
    });

    expect(setCookies).toHaveLength(1);
    expect(setCookies[0]).toMatch(new RegExp(`^${THEME_COOKIE_CONFIG.name}=dark;`));
    expect(setCookies[0]).toContain("Max-Age=");
    expect(setCookies[0]).toContain("SameSite=Lax");
  });

  it("does not refresh Set-Cookie when preference is system", () => {
    const req = { headers: {} } as Request;
    const setCookies: string[] = [];
    const res = {
      append(name: string, value: string) {
        if (name.toLowerCase() === "set-cookie") setCookies.push(value);
      },
    } as unknown as Response;

    themePreferenceMiddleware(req, res, () => {
      expect(getThemePreference()).toBe("system");
    });

    expect(setCookies).toHaveLength(0);
  });
});
