#!/usr/bin/env node
/**
 * Reads design token JSON under `src/web/tokens/` and writes
 * `src/web/public/design-tokens.css` (CSS custom properties).
 *
 * If a token's `value` matches another token's `name`, the output uses
 * `var(--<name-with-dots-as-hyphens>)`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(__dirname, "..");
const TOKENS_DIR = path.join(APP_ROOT, "src/web/tokens");
const OUT_FILE = path.join(APP_ROOT, "src/web/public/design-tokens.css");

/** Order is output order within :root (color primitives first, then scales). */
const TOKEN_FILES = [
  "colors.json",
  "space.json",
  "radius.json",
  "font-weight.json",
  "font-size.json",
  "line-height.json",
  "letter-spacing.json",
];

function die(message) {
  console.error(message);
  process.exit(1);
}

function tokenNameToVar(name) {
  return `--${name.replace(/\./g, "-")}`;
}

/** "surfaceMuted" → "surface-muted" */
function camelToKebab(s) {
  return s.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`).replace(/^-/, "");
}

/** `color.light.bg` → `--color-bg` */
function themeAliasCssName(themePrefix, fullName) {
  const suffix = fullName.slice(themePrefix.length);
  return `--color-${camelToKebab(suffix)}`;
}

function loadTokens() {
  const tokens = [];
  for (const file of TOKEN_FILES) {
    const filePath = path.join(TOKENS_DIR, file);
    if (!fs.existsSync(filePath)) die(`Missing token file: ${filePath}`);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(data)) die(`${file}: root must be a JSON array`);
    for (const item of data) {
      if (
        !item ||
        typeof item.name !== "string" ||
        typeof item.value !== "string"
      ) {
        die(`${file}: each item must have string "name" and "value"`);
      }
      if (item.description != null && typeof item.description !== "string") {
        die(`${file}: optional "description" must be a string`);
      }
      tokens.push({
        name: item.name,
        value: item.value,
        description: item.description,
        _file: file,
      });
    }
  }
  return tokens;
}

function sortByTokenName(a, b) {
  return a.name.localeCompare(b.name, undefined, { numeric: true });
}

function escapeComment(s) {
  return s.replace(/\*\//g, "* /");
}

/**
 * Authoritative palette list lives in `src/web/tokens/scheme-hue-defs.ts` (id + user-facing label).
 * Parsed here so the token build has no second source of truth.
 */
function loadSchemeHueDefs() {
  const p = path.join(TOKENS_DIR, "scheme-hue-defs.ts");
  if (!fs.existsSync(p)) {
    die(`Missing scheme hue def source: ${p}`);
  }
  const src = fs.readFileSync(p, "utf8");
  const re = /\{ id: "([^"]+)" as const, label: "([^"]+)" \}/g;
  const out = [];
  for (;;) {
    const m = re.exec(src);
    if (m == null) break;
    out.push({ id: m[1], label: m[2] });
  }
  if (out.length < 1) {
    die("Could not parse any { id, label } from scheme-hue-defs.ts");
  }
  return out;
}

/** True if `value` is another token's name or a literal CSS fragment we accept. */
function isValidTokenValue(value, names) {
  if (names.has(value)) return true;
  if (/^#[0-9A-Fa-f]{3,8}$/.test(value)) return true;
  if (/^-?(\d*\.)?\d+(rem|em|ex|ch|lh|rlh|vw|vh|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh|%|px|cm|mm|in|pt|pc)?$/i.test(value)) return true;
  if (value === "0") return true;
  if (/^-?\d+(\.\d+)?$/.test(value)) return true;
  if (value === "0em" || value === "0rem") return true;
  return false;
}

function main() {
  const tokens = loadTokens();
  const names = new Set(tokens.map((t) => t.name));

  for (const t of tokens) {
    if (isValidTokenValue(t.value, names)) continue;
    die(
      `Token "${t.name}": value "${t.value}" is not a known token name and does not look like a raw CSS value.`,
    );
  }

  /** @param {string} value */
  function resolveValue(value) {
    if (names.has(value)) return `var(${tokenNameToVar(value)})`;
    return value;
  }

  const colorPrimitives = [];
  const colorLight = [];
  const colorDark = [];
  const colorSemantic = [];
  const nonColor = [];

  for (const t of tokens) {
    if (t._file !== "colors.json") {
      nonColor.push(t);
      continue;
    }
    const n = t.name;
    if (n.startsWith("color.light.")) colorLight.push(t);
    else if (n.startsWith("color.dark.")) colorDark.push(t);
    else if (n.startsWith("color.semantic.")) colorSemantic.push(t);
    else if (n.startsWith("scheme.")) {
      colorPrimitives.push(t);
    } else if (
      n.startsWith("brand.") ||
      n.startsWith("neutral.") ||
      n.startsWith("success.") ||
      n.startsWith("warning.") ||
      n.startsWith("danger.") ||
      n.startsWith("info.")
    ) {
      colorPrimitives.push(t);
    } else {
      die(`Unexpected token name in colors.json: "${n}"`);
    }
  }

  const lightKeys = new Set(colorLight.map((t) => t.name.slice("color.light.".length)));
  const darkKeys = new Set(colorDark.map((t) => t.name.slice("color.dark.".length)));
  for (const k of lightKeys) {
    if (!darkKeys.has(k)) die(`Missing color.dark.${k} (light defines it)`);
  }
  for (const k of darkKeys) {
    if (!lightKeys.has(k)) die(`Missing color.light.${k} (dark defines it)`);
  }

  const SCHEME_HUE_DEFS = loadSchemeHueDefs();
  const BRAND_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  const NEUTRAL_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

  const lines = [];
  lines.push("/**");
  lines.push(" * Design tokens as CSS custom properties.");
  lines.push(" * Generated by scripts/build-design-tokens.mjs — do not edit by hand.");
  lines.push(" */");
  lines.push("");

  lines.push(":root {");
  lines.push("  /* Palette primitives, grouped by hue: --scheme-{hue}-* (accent) + --scheme-{hue}-neutral-* (surfaces) */");
  lines.push("");

  const tokenByName = new Map(
    colorPrimitives
      .filter((t) => t.name.startsWith("scheme."))
      .map((t) => [t.name, t]),
  );
  for (const { id, label } of SCHEME_HUE_DEFS) {
    lines.push(`  /* – ${label}: accent (brand) – */`);
    for (const step of BRAND_STEPS) {
      const name = `scheme.${id}.${step}`;
      const t = tokenByName.get(name);
      if (!t) die(`Missing token "${name}" (accent ramp for ${id})`);
      if (t.description) lines.push(`  /* ${escapeComment(t.description)} */`);
      lines.push(`  ${tokenNameToVar(t.name)}: ${resolveValue(t.value)};`);
    }
    lines.push(`  /* – ${label}: surface neutrals – */`);
    for (const step of NEUTRAL_STEPS) {
      const name = `scheme.${id}.neutral.${step}`;
      const t = tokenByName.get(name);
      if (!t) die(`Missing token "${name}" (neutral ramp for ${id})`);
      if (t.description) lines.push(`  /* ${escapeComment(t.description)} */`);
      lines.push(`  ${tokenNameToVar(t.name)}: ${resolveValue(t.value)};`);
    }
    lines.push("");
  }

  const otherPrimitives = colorPrimitives.filter((t) => !t.name.startsWith("scheme."));
  for (const t of otherPrimitives.sort(sortByTokenName)) {
    if (t.description) lines.push(`  /* ${escapeComment(t.description)} */`);
    lines.push(`  ${tokenNameToVar(t.name)}: ${resolveValue(t.value)};`);
  }

  lines.push("");

  for (const t of nonColor.sort(sortByTokenName)) {
    if (t.description) lines.push(`  /* ${escapeComment(t.description)} */`);
    lines.push(`  ${tokenNameToVar(t.name)}: ${resolveValue(t.value)};`);
  }

  lines.push("");

  for (const t of colorSemantic.sort(sortByTokenName)) {
    const cssName = themeAliasCssName("color.semantic.", t.name);
    if (t.description) lines.push(`  /* ${escapeComment(t.description)} */`);
    lines.push(`  ${cssName}: ${resolveValue(t.value)};`);
  }

  lines.push("");

  for (const t of colorLight.sort(sortByTokenName)) {
    const cssName = themeAliasCssName("color.light.", t.name);
    if (t.description) lines.push(`  /* ${escapeComment(t.description)} */`);
    lines.push(`  ${cssName}: ${resolveValue(t.value)};`);
  }

  lines.push("}");
  lines.push("");

  const darkBodyLines = colorDark.sort(sortByTokenName).map((t) => {
    const cssName = themeAliasCssName("color.dark.", t.name);
    return `  ${cssName}: ${resolveValue(t.value)};`;
  });

  lines.push('html[data-theme="dark"] {');
  lines.push(...darkBodyLines);
  lines.push("}");
  lines.push("");
  lines.push("@media (prefers-color-scheme: dark) {");
  lines.push('  html[data-theme="system"] {');
  lines.push(...darkBodyLines.map((line) => `  ${line}`));
  lines.push("  }");
  lines.push("}");
  lines.push("");

  /**
   * Remap `brand.*` and `neutral.*` to the active hue (`ndb2_color_scheme` + `data-color-scheme`).
   * `neutral.0` (white) is not remapped. Sources: `--scheme-{hue}-*`, `--scheme-{hue}-neutral-*`.
   */
  lines.push("/* ———————————————————————————————————————————————————— */");
  lines.push("/* Per-`data-color-scheme` remaps (active accent + surface neutrals) */");
  lines.push("/* ———————————————————————————————————————————————————— */");
  lines.push("");

  for (const { id, label } of SCHEME_HUE_DEFS) {
    lines.push(`/* [${label}] :root tokens → --brand-* / --neutral-* when data-color-scheme=\"${id}\" */`);
    lines.push(`html[data-color-scheme="${id}"] {`);
    for (const step of BRAND_STEPS) {
      const from = `scheme.${id}.${step}`;
      if (!names.has(from)) die(`Missing token "${from}" (brand remap for ${id})`);
      lines.push(`  --brand-${step}: var(${tokenNameToVar(from)});`);
    }
    for (const step of NEUTRAL_STEPS) {
      const fromN = `scheme.${id}.neutral.${step}`;
      if (!names.has(fromN)) die(`Missing token "${fromN}" (neutral remap for ${id})`);
      lines.push(`  --neutral-${step}: var(${tokenNameToVar(fromN)});`);
    }
    lines.push("}");
    lines.push("");
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, `${lines.join("\n")}\n`, "utf8");
  console.error("Wrote", path.relative(APP_ROOT, OUT_FILE));
}

main();
