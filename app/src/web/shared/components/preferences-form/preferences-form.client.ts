import { COLOR_SCHEME_COOKIE_CONFIG, THEME_COOKIE_CONFIG } from "../../../theme-cookie-constants.js";
import { syncUIFromNative } from "../select/select-display-sync.js";
import { SCHEME_HUE_DEFS } from "../../../tokens/scheme-hue-defs.js";

const VALID_SCHEMES = new Set<string>(SCHEME_HUE_DEFS.map((d) => d.id));

function buildThemeCookie(theme: "light" | "dark"): string {
  const c = THEME_COOKIE_CONFIG;
  return `${c.name}=${encodeURIComponent(theme)}; Path=${c.path}; Max-Age=${c.maxAgeSec}; SameSite=${c.sameSite}`;
}

function clearThemeCookie(): string {
  const c = THEME_COOKIE_CONFIG;
  return `${c.name}=; Path=${c.path}; Max-Age=0; SameSite=${c.sameSite}`;
}

function buildColorSchemeCookie(scheme: string): string {
  const c = COLOR_SCHEME_COOKIE_CONFIG;
  return `${c.name}=${encodeURIComponent(scheme)}; Path=${c.path}; Max-Age=${c.maxAgeSec}; SameSite=${c.sameSite}`;
}

function isTheme(value: string): value is "system" | "light" | "dark" {
  return value === "system" || value === "light" || value === "dark";
}

function setDocumentCookiesAndAttrs(theme: "system" | "light" | "dark", colorScheme: string): void {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-color-scheme", colorScheme);
  if (theme === "system") {
    document.cookie = clearThemeCookie();
  } else {
    document.cookie = buildThemeCookie(theme);
  }
  document.cookie = buildColorSchemeCookie(colorScheme);
}

/**
 * When one preferences block changes, keep every instance (e.g. mobile + desktop nav) in sync
 * and mirror the same `data-*` + cookies as the server middleware.
 */
function syncAllPreferenceForms(theme: "system" | "light" | "dark", colorScheme: string): void {
  setDocumentCookiesAndAttrs(theme, colorScheme);
  for (const block of document.querySelectorAll<HTMLElement>("[data-preferences-form]")) {
    const themeSel = block.querySelector<HTMLSelectElement>('select[name="theme"]');
    const colorSel = block.querySelector<HTMLSelectElement>('select[name="colorScheme"]');
    if (themeSel != null && themeSel.value !== theme) {
      themeSel.value = theme;
    }
    if (colorSel != null && colorSel.value !== colorScheme) {
      colorSel.value = colorScheme;
    }
    for (const root of block.querySelectorAll<HTMLElement>("[data-select]")) {
      syncUIFromNative(root);
    }
  }
}

function onSelectChange(target: EventTarget | null): void {
  if (target == null || !(target instanceof HTMLSelectElement)) {
    return;
  }
  const name = target.name;
  if (name !== "theme" && name !== "colorScheme") {
    return;
  }
  const block = target.closest<HTMLElement>("[data-preferences-form]");
  if (block == null) {
    return;
  }
  const themeSel = block.querySelector<HTMLSelectElement>('select[name="theme"]');
  const colorSel = block.querySelector<HTMLSelectElement>('select[name="colorScheme"]');
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

function wire(): void {
  document.addEventListener("change", (e) => {
    onSelectChange(e.target);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wire, { once: true });
} else {
  wire();
}

export {};
