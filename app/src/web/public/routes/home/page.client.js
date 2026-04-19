/**
 * Home route client island: theme cookie + <html data-theme>.
 * Max-Age must stay in sync with THEME_COOKIE_MAX_AGE_SEC in app/src/web/middleware/themePreferenceMiddleware.ts
 */
(function () {
  var COOKIE_NAME = "ndb2_theme";
  var MAX_AGE_SEC = 34560000; /* 400 days — sync with cookie.ts */

  function setCookie(theme) {
    if (theme === "system") {
      document.cookie =
        COOKIE_NAME + "=; Path=/; Max-Age=0; SameSite=Lax";
      return;
    }
    document.cookie =
      COOKIE_NAME +
      "=" +
      encodeURIComponent(theme) +
      "; Path=/; Max-Age=" +
      MAX_AGE_SEC +
      "; SameSite=Lax";
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
