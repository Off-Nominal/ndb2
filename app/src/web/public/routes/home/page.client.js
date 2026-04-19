var THEME_COOKIE_CONFIG = {
  name: "ndb2_theme",
  path: "/",
  maxAgeSec: 60 * 60 * 24 * 400,
  sameSite: "Lax",
};

/**
 * Home route client island: theme cookie + <html data-theme>.
 * `THEME_COOKIE_CONFIG` must match `THEME_COOKIE_CONFIG` in theme-preference.ts.
 */
(function () {
  function buildPersistCookieHeader(theme) {
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

  function buildClearCookieHeader() {
    var c = THEME_COOKIE_CONFIG;
    return c.name + "=; Path=" + c.path + "; Max-Age=0; SameSite=" + c.sameSite;
  }

  function setCookie(theme) {
    if (theme === "system") {
      document.cookie = buildClearCookieHeader();
      return;
    }
    document.cookie = buildPersistCookieHeader(theme);
  }

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    setCookie(theme);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var sel = document.getElementById("theme-select");
    if (!sel) return;
    sel.addEventListener("change", function () {
      apply(sel.value);
    });
  });
})();
