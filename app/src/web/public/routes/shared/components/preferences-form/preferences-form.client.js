"use strict";
(() => {
  // src/web/theme-cookie-constants.ts
  var THEME_COOKIE_CONFIG = {
    name: "ndb2_theme",
    path: "/",
    maxAgeSec: 60 * 60 * 24 * 400,
    sameSite: "Lax"
  };
  var COLOR_SCHEME_COOKIE_CONFIG = {
    name: "ndb2_color_scheme",
    path: "/",
    maxAgeSec: 60 * 60 * 24 * 400,
    sameSite: "Lax"
  };

  // src/web/shared/components/select/select-display-sync.ts
  function optionDisplayLabelForNativeSelect(native) {
    const v = native.value;
    for (let i = 0; i < native.options.length; i++) {
      const o = native.options[i];
      if (o.value === v) {
        return (o.textContent?.trim() || o.label?.trim() || o.value).trim() || o.value;
      }
    }
    if (native.selectedIndex >= 0) {
      const o = native.options[native.selectedIndex];
      return (o.textContent?.trim() || o.label?.trim() || o.value).trim() || v;
    }
    return v;
  }
  function syncUIFromNative(root) {
    const native = root.querySelector("[data-select-native]");
    const valueEl = root.querySelector("[data-select-value]");
    if (native == null || valueEl == null) {
      return;
    }
    const display = optionDisplayLabelForNativeSelect(native);
    if (display !== "") {
      valueEl.textContent = display;
    }
    for (const li of root.querySelectorAll("[data-select-option]")) {
      const optVal = li.dataset.value ?? "";
      li.setAttribute("aria-selected", optVal === native.value ? "true" : "false");
    }
  }

  // src/web/tokens/scheme-hue-defs.ts
  var SCHEME_HUE_DEFS = [
    { id: "neptune", label: "Neptune Blue" },
    { id: "aurora", label: "Aurora Green" },
    { id: "helios", label: "Helios Yellow" },
    { id: "nebula", label: "Nebula Purple" },
    { id: "redshift", label: "Redshift Red" },
    { id: "titan", label: "Titan Orange" }
  ];

  // src/web/shared/components/preferences-form/preferences-form.client.ts
  var VALID_SCHEMES = new Set(SCHEME_HUE_DEFS.map((d) => d.id));
  function buildThemeCookie(theme) {
    const c = THEME_COOKIE_CONFIG;
    return `${c.name}=${encodeURIComponent(theme)}; Path=${c.path}; Max-Age=${c.maxAgeSec}; SameSite=${c.sameSite}`;
  }
  function clearThemeCookie() {
    const c = THEME_COOKIE_CONFIG;
    return `${c.name}=; Path=${c.path}; Max-Age=0; SameSite=${c.sameSite}`;
  }
  function buildColorSchemeCookie(scheme) {
    const c = COLOR_SCHEME_COOKIE_CONFIG;
    return `${c.name}=${encodeURIComponent(scheme)}; Path=${c.path}; Max-Age=${c.maxAgeSec}; SameSite=${c.sameSite}`;
  }
  function isTheme(value) {
    return value === "system" || value === "light" || value === "dark";
  }
  function setDocumentCookiesAndAttrs(theme, colorScheme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-color-scheme", colorScheme);
    if (theme === "system") {
      document.cookie = clearThemeCookie();
    } else {
      document.cookie = buildThemeCookie(theme);
    }
    document.cookie = buildColorSchemeCookie(colorScheme);
  }
  function syncAllPreferenceForms(theme, colorScheme) {
    setDocumentCookiesAndAttrs(theme, colorScheme);
    for (const block of document.querySelectorAll("[data-preferences-form]")) {
      const themeSel = block.querySelector('select[name="theme"]');
      const colorSel = block.querySelector('select[name="colorScheme"]');
      if (themeSel != null && themeSel.value !== theme) {
        themeSel.value = theme;
      }
      if (colorSel != null && colorSel.value !== colorScheme) {
        colorSel.value = colorScheme;
      }
      for (const root of block.querySelectorAll("[data-select]")) {
        syncUIFromNative(root);
      }
    }
  }
  function onSelectChange(target) {
    if (target == null || !(target instanceof HTMLSelectElement)) {
      return;
    }
    const name = target.name;
    if (name !== "theme" && name !== "colorScheme") {
      return;
    }
    const block = target.closest("[data-preferences-form]");
    if (block == null) {
      return;
    }
    const themeSel = block.querySelector('select[name="theme"]');
    const colorSel = block.querySelector('select[name="colorScheme"]');
    if (themeSel == null || colorSel == null) {
      return;
    }
    const themeRaw = themeSel.value;
    const colorRaw = colorSel.value;
    if (!isTheme(themeRaw) || !VALID_SCHEMES.has(colorRaw)) {
      return;
    }
    syncAllPreferenceForms(themeRaw, colorRaw);
  }
  function wire() {
    document.addEventListener("change", (e) => {
      onSelectChange(e.target);
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire, { once: true });
  } else {
    wire();
  }
})();
