import type { Request, Response } from "express";
import { describe, expect, it } from "vitest";
import {
  COLOR_SCHEME_COOKIE_CONFIG,
  getColorScheme,
  getThemePreference,
  parseColorSchemeCookieValue,
  parseThemeCookie,
  themePreferenceMiddleware,
  THEME_COOKIE_CONFIG,
} from "./theme-preference";

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

describe("parseColorSchemeCookieValue", () => {
  it("returns undefined when header missing or cookie absent", () => {
    expect(parseColorSchemeCookieValue(undefined)).toBeUndefined();
    expect(parseColorSchemeCookieValue("foo=1")).toBeUndefined();
  });

  it("reads a valid palette id and decodes it", () => {
    expect(
      parseColorSchemeCookieValue(
        `x=1; ${COLOR_SCHEME_COOKIE_CONFIG.name}=${encodeURIComponent("redshift")}; y=2`,
      ),
    ).toBe("redshift");
  });

  it("returns unknown values as-is (caller normalizes to default neptune)", () => {
    expect(parseColorSchemeCookieValue(`${COLOR_SCHEME_COOKIE_CONFIG.name}=nope`)).toBe("nope");
  });
});

describe("getColorScheme (async local storage)", () => {
  it("returns neptune when called outside request context", () => {
    expect(getColorScheme()).toBe("neptune");
  });

  it("returns persisted palette and refreshes Set-Cookie", () => {
    const req = {
      headers: { cookie: `${COLOR_SCHEME_COOKIE_CONFIG.name}=aurora` },
    } as Request;
    const setCookies: string[] = [];
    const res = {
      append(name: string, value: string) {
        if (name.toLowerCase() === "set-cookie") setCookies.push(value);
      },
    } as unknown as Response;

    themePreferenceMiddleware(req, res, () => {
      expect(getColorScheme()).toBe("aurora");
    });

    expect(setCookies.some((c) => c.startsWith(`${COLOR_SCHEME_COOKIE_CONFIG.name}=aurora;`))).toBe(
      true,
    );
  });

  it("migrates legacy `blue` cookie to neptune and refreshes", () => {
    const req = {
      headers: { cookie: `${COLOR_SCHEME_COOKIE_CONFIG.name}=blue` },
    } as Request;
    const setCookies: string[] = [];
    const res = {
      append(name: string, value: string) {
        if (name.toLowerCase() === "set-cookie") setCookies.push(value);
      },
    } as unknown as Response;

    themePreferenceMiddleware(req, res, () => {
      expect(getColorScheme()).toBe("neptune");
    });

    expect(setCookies.some((c) => c.startsWith(`${COLOR_SCHEME_COOKIE_CONFIG.name}=neptune;`))).toBe(
      true,
    );
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
      expect(getColorScheme()).toBe("neptune");
    });

    expect(setCookies).toHaveLength(1);
    expect(setCookies[0]!).toMatch(new RegExp(`^${THEME_COOKIE_CONFIG.name}=dark;`));
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
      expect(getColorScheme()).toBe("neptune");
    });

    expect(setCookies).toHaveLength(0);
  });
});
