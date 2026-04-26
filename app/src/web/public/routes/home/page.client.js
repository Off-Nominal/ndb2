var THEME_COOKIE_CONFIG = {
  name: "ndb2_theme",
  path: "/",
  maxAgeSec: 60 * 60 * 24 * 400,
  sameSite: "Lax",
};

var COLOR_SCHEME_COOKIE_CONFIG = {
  name: "ndb2_color_scheme",
  path: "/",
  maxAgeSec: 60 * 60 * 24 * 400,
  sameSite: "Lax",
};

/**
 * Home route client island: theme + accent cookies and `<html data-theme>` / `data-color-scheme`.
 * `*_COOKIE_CONFIG` must match `theme-preference.ts`.
 */
(function () {
  function buildThemePersistCookieHeader(theme) {
    var c = THEME_COOKIE_CONFIG;
    return (
      c.name +
      "=" +
      encodeURIComponent(theme) +
      "; Path=" +
      c.path +
      "; Max-Age=" +
      c.maxAgeSec +
      "; SameSite=" +
      c.sameSite
    );
  }

  function buildThemeClearCookieHeader() {
    var c = THEME_COOKIE_CONFIG;
    return c.name + "=; Path=" + c.path + "; Max-Age=0; SameSite=" + c.sameSite;
  }

  function setThemeCookie(theme) {
    if (theme === "system") {
      document.cookie = buildThemeClearCookieHeader();
      return;
    }
    document.cookie = buildThemePersistCookieHeader(theme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    setThemeCookie(theme);
  }

  function buildColorSchemePersistCookieHeader(scheme) {
    var c = COLOR_SCHEME_COOKIE_CONFIG;
    return (
      c.name +
      "=" +
      encodeURIComponent(scheme) +
      "; Path=" +
      c.path +
      "; Max-Age=" +
      c.maxAgeSec +
      "; SameSite=" +
      c.sameSite
    );
  }

  function applyColorScheme(scheme) {
    document.documentElement.setAttribute("data-color-scheme", scheme);
    document.cookie = buildColorSchemePersistCookieHeader(scheme);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var themeSel = document.getElementById("theme-select");
    if (themeSel) {
      themeSel.addEventListener("change", function () {
        applyTheme(themeSel.value);
      });
    }
    var colorSel = document.getElementById("color-scheme-select");
    if (colorSel) {
      colorSel.addEventListener("change", function () {
        applyColorScheme(colorSel.value);
      });
    }
  });
})();
