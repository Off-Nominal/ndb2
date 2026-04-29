#!/usr/bin/env node
/**
 * Reads design token JSON under `src/web/tokens/` plus `colour-schemes.json` and writes
 * `src/web/generated/design-tokens.css` (CSS custom properties; imported by CUBE entry + Vite).
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
const OUT_FILE = path.join(APP_ROOT, "src/web/generated/design-tokens.css");

/** Order is output order within :root (color primitives first, then scales). */
const TOKEN_FILES = [
  "colors.json",
  "space.json",
  "breakpoints.json",
  "radius.json",
  "font-family.json",
  "font-size.json",
  "font-weight.json",
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

const COLOUR_SCHEMES_FILE = "colour-schemes.json";

/** @typedef {{ upTo200: number; upTo400: number; from500: number }} BrandNeutralMixTiers */

/**
 * @param {number} step
 * @param {BrandNeutralMixTiers} tiers
 */
function mixPercentForBrandStep(step, tiers) {
  if (step <= 200) return tiers.upTo200;
  if (step <= 400) return tiers.upTo400;
  return tiers.from500;
}

/**
 * @param {Record<string, unknown>} obj
 * @param {string} context
 * @returns {BrandNeutralMixTiers}
 */
function readMixTiersObject(obj, context) {
  const keys = /** @type {const} */ (["upTo200", "upTo400", "from500"]);
  /** @type {BrandNeutralMixTiers} */
  const out = { upTo200: 0, upTo400: 0, from500: 0 };
  for (const k of keys) {
    const v = obj[k];
    if (typeof v !== "number" || !Number.isInteger(v)) {
      die(`${COLOUR_SCHEMES_FILE}: ${context}.${k} must be an integer`);
    }
    if (v < 0 || v > 100) die(`${COLOUR_SCHEMES_FILE}: ${context}.${k} must be between 0 and 100`);
    out[k] = v;
  }
  return out;
}

/**
 * @param {BrandNeutralMixTiers | null} tiers
 */
function tiersHaveEffect(tiers) {
  if (tiers == null) return false;
  return tiers.upTo200 > 0 || tiers.upTo400 > 0 || tiers.from500 > 0;
}

/**
 * @param {unknown} rawApp
 * @param {BrandNeutralMixTiers} defaultTiers
 * @param {string} schemeId
 * @param {string} appearanceName
 * @returns {BrandNeutralMixTiers | null}
 */
function resolveAppearanceMix(rawApp, defaultTiers, schemeId, appearanceName) {
  if (rawApp === 0) return null;
  if (typeof rawApp !== "object" || rawApp === null) {
    die(
      `${COLOUR_SCHEMES_FILE}: "${schemeId}"."${appearanceName}" must be 0 or an object (see mixTiers / inherit).`,
    );
  }
  /** @type {Record<string, unknown>} */
  const o = /** @type {Record<string, unknown>} */ (rawApp);
  const allowed = new Set(["inherit", "upTo200", "upTo400", "from500", "description"]);
  for (const k of Object.keys(o)) {
    if (!allowed.has(k)) {
      die(
        `${COLOUR_SCHEMES_FILE}: "${schemeId}"."${appearanceName}" unknown key "${k}" (allowed: inherit, upTo200, upTo400, from500, description).`,
      );
    }
  }
  if (o.description != null && typeof o.description !== "string") {
    die(`${COLOUR_SCHEMES_FILE}: "${schemeId}"."${appearanceName}".description must be a string when present`);
  }

  const inherit = o.inherit === true;
  const explicit = ["upTo200", "upTo400", "from500"].map((k) => o[k]).filter((v) => v !== undefined);
  if (inherit && explicit.length > 0) {
    die(
      `${COLOUR_SCHEMES_FILE}: "${schemeId}"."${appearanceName}" cannot set inherit:true together with tier percentages.`,
    );
  }
  if (inherit) {
    return { ...defaultTiers };
  }
  if (explicit.length === 3) {
    return readMixTiersObject(o, `"${schemeId}"."${appearanceName}"`);
  }
  if (explicit.length === 0 && !inherit) {
    die(
      `${COLOUR_SCHEMES_FILE}: "${schemeId}"."${appearanceName}" must use { \"inherit\": true } or set upTo200, upTo400, and from500.`,
    );
  }
  die(
    `${COLOUR_SCHEMES_FILE}: "${schemeId}"."${appearanceName}" must set all three of upTo200, upTo400, from500 when not using inherit.`,
  );
}

/**
 * @param {{ id: string; label: string }[]} schemeHueDefs
 * @returns {Map<string, { label: string; description: string; light: BrandNeutralMixTiers | null; dark: BrandNeutralMixTiers | null }>}
 */
function loadColourSchemeMixes(schemeHueDefs) {
  const p = path.join(TOKENS_DIR, COLOUR_SCHEMES_FILE);
  if (!fs.existsSync(p)) {
    die(`Missing ${COLOUR_SCHEMES_FILE} (expected next to other tokens)`);
  }
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.schemes)) {
    die(`${COLOUR_SCHEMES_FILE}: root must be an object with a "schemes" array`);
  }

  const rootKeys = new Set(Object.keys(raw));
  const allowedRoot = new Set(["description", "mixTiers", "schemes"]);
  for (const k of rootKeys) {
    if (!allowedRoot.has(k)) {
      die(`${COLOUR_SCHEMES_FILE}: unknown root key "${k}" (allowed: description, mixTiers, schemes)`);
    }
  }
  if (raw.description != null && typeof raw.description !== "string") {
    die(`${COLOUR_SCHEMES_FILE}: root "description" must be a string when present`);
  }
  if (!raw.mixTiers || typeof raw.mixTiers !== "object") {
    die(`${COLOUR_SCHEMES_FILE}: root "mixTiers" is required (object with upTo200, upTo400, from500)`);
  }
  const mt = /** @type {Record<string, unknown>} */ (raw.mixTiers);
  for (const k of Object.keys(mt)) {
    if (!["description", "upTo200", "upTo400", "from500"].includes(k)) {
      die(`${COLOUR_SCHEMES_FILE}: mixTiers unknown key "${k}"`);
    }
  }
  if (mt.description != null && typeof mt.description !== "string") {
    die(`${COLOUR_SCHEMES_FILE}: mixTiers.description must be a string when present`);
  }
  const defaultMixTiers = readMixTiersObject(mt, "mixTiers");

  const allowed = new Set(schemeHueDefs.map((h) => h.id));
  const seen = new Set();
  /** @type {Map<string, { label: string; description: string; light: BrandNeutralMixTiers | null; dark: BrandNeutralMixTiers | null }>} */
  const out = new Map();

  for (const row of raw.schemes) {
    if (!row || typeof row !== "object") die(`${COLOUR_SCHEMES_FILE}: invalid schemes[] entry`);
    const allowedRow = new Set(["id", "label", "description", "light", "dark"]);
    for (const k of Object.keys(row)) {
      if (!allowedRow.has(k)) {
        die(`${COLOUR_SCHEMES_FILE}: unknown key on scheme row "${k}"`);
      }
    }
    const { id, label, description, light, dark } = row;
    if (typeof id !== "string" || id === "") die(`${COLOUR_SCHEMES_FILE}: each scheme needs string "id"`);
    if (typeof label !== "string" || label.trim() === "") {
      die(`${COLOUR_SCHEMES_FILE}: "${id}" needs non-empty string "label" (human-readable, e.g. Neptune — blue).`);
    }
    if (typeof description !== "string" || description.trim() === "") {
      die(`${COLOUR_SCHEMES_FILE}: "${id}" needs non-empty string "description" for developers.`);
    }
    if (!allowed.has(id)) die(`${COLOUR_SCHEMES_FILE}: unknown scheme id "${id}" (not in scheme-hue-defs.ts)`);
    if (seen.has(id)) die(`${COLOUR_SCHEMES_FILE}: duplicate id "${id}"`);
    seen.add(id);

    const lightTiers = resolveAppearanceMix(light, defaultMixTiers, id, "light");
    const darkTiers = resolveAppearanceMix(dark, defaultMixTiers, id, "dark");

    out.set(id, { label, description, light: lightTiers, dark: darkTiers });
  }

  for (const id of allowed) {
    if (!seen.has(id)) die(`${COLOUR_SCHEMES_FILE}: missing scheme "${id}"`);
  }

  return out;
}

/**
 * @param {string[]} lines
 * @param {{ id: string; label: string }[]} schemeHueDefs
 * @param {number[]} brandSteps
 * @param {Map<string, { label: string; description: string; light: BrandNeutralMixTiers | null; dark: BrandNeutralMixTiers | null }>} mixBySchemeId
 */
function emitBrandNeutralMixRules(lines, schemeHueDefs, brandSteps, mixBySchemeId) {
  /** @param {BrandNeutralMixTiers | null} tiers */
  function brandStepLines(schemeId, tiers) {
    if (tiers == null || !tiersHaveEffect(tiers)) return [];
    return brandSteps.map((step) => {
      const n = mixPercentForBrandStep(step, tiers);
      const accentVar = tokenNameToVar(`scheme.${schemeId}.${step}`);
      const neutralVar = tokenNameToVar(`scheme.${schemeId}.neutral.500`);
      return `  --brand-${step}: color-mix(in srgb, var(${accentVar}) ${100 - n}%, var(${neutralVar}) ${n}%);`;
    });
  }

  const anyLight = [...mixBySchemeId.values()].some((m) => tiersHaveEffect(m.light));
  const anyDark = [...mixBySchemeId.values()].some((m) => tiersHaveEffect(m.dark));
  if (!anyLight && !anyDark) return;

  lines.push("/* ———————————————————————————————————————————————————— */");
  lines.push(`/* Brand ramp × neutral-500 mix — data: tokens/${COLOUR_SCHEMES_FILE}. */`);
  lines.push("/* ———————————————————————————————————————————————————— */");
  lines.push("");

  for (const { id } of schemeHueDefs) {
    const cfg = mixBySchemeId.get(id);
    if (cfg == null) continue;

    if (tiersHaveEffect(cfg.light)) {
      const t = /** @type {BrandNeutralMixTiers} */ (cfg.light);
      lines.push(`/* ${escapeComment(cfg.label)} — ${escapeComment(cfg.description)} */`);
      lines.push(
        `/* light: neutral-500 mix (%) — brand ≤200: ${t.upTo200}, ≤400: ${t.upTo400}, ≥500: ${t.from500} */`,
      );
      const body = brandStepLines(id, cfg.light);
      if (body.length === 0) continue;
      lines.push(`html[data-theme="light"][data-color-scheme="${id}"] {`);
      lines.push(...body);
      lines.push("}");
      lines.push("");
      lines.push("@media (prefers-color-scheme: light) {");
      lines.push(`  html[data-theme="system"][data-color-scheme="${id}"] {`);
      lines.push(...body.map((line) => `  ${line}`));
      lines.push("  }");
      lines.push("}");
      lines.push("");
    }

    if (tiersHaveEffect(cfg.dark)) {
      const t = /** @type {BrandNeutralMixTiers} */ (cfg.dark);
      lines.push(`/* ${escapeComment(cfg.label)} — ${escapeComment(cfg.description)} */`);
      lines.push(
        `/* dark: neutral-500 mix (%) — brand ≤200: ${t.upTo200}, ≤400: ${t.upTo400}, ≥500: ${t.from500} */`,
      );
      const body = brandStepLines(id, cfg.dark);
      if (body.length === 0) continue;
      lines.push(`html[data-theme="dark"][data-color-scheme="${id}"] {`);
      lines.push(...body);
      lines.push("}");
      lines.push("");
      lines.push("@media (prefers-color-scheme: dark) {");
      lines.push(`  html[data-theme="system"][data-color-scheme="${id}"] {`);
      lines.push(...body.map((line) => `  ${line}`));
      lines.push("  }");
      lines.push("}");
      lines.push("");
    }
  }
}

/** Comma-separated `font-family` list (e.g. `Oxanium, sans-serif` or `"Droid Sans", sans-serif`). */
function isFontFamilyList(value) {
  return /^("[^"]+"|'[^']+'|[-A-Za-z0-9.]+)(\s*,\s*("[^"]+"|'[^']+'|[-A-Za-z0-9.]+))+\s*$/.test(
    value.trim(),
  );
}

/** True if `value` is another token's name or a literal CSS fragment we accept. */
function isValidTokenValue(value, names) {
  if (names.has(value)) return true;
  if (/^#[0-9A-Fa-f]{3,8}$/.test(value)) return true;
  if (/^-?(\d*\.)?\d+(rem|em|ex|ch|lh|rlh|vw|vh|vmin|vmax|svw|svh|lvw|lvh|dvw|dvh|%|px|cm|mm|in|pt|pc)?$/i.test(value)) return true;
  if (value === "0") return true;
  if (/^-?\d+(\.\d+)?$/.test(value)) return true;
  if (value === "0em" || value === "0rem") return true;
  if (isFontFamilyList(value)) return true;
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
  const colourSchemeMixes = loadColourSchemeMixes(SCHEME_HUE_DEFS);
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
    const docLabel = colourSchemeMixes.get(id)?.label ?? label;
    lines.push(`  /* – ${docLabel}: accent (brand) – */`);
    for (const step of BRAND_STEPS) {
      const name = `scheme.${id}.${step}`;
      const t = tokenByName.get(name);
      if (!t) die(`Missing token "${name}" (accent ramp for ${id})`);
      if (t.description) lines.push(`  /* ${escapeComment(t.description)} */`);
      lines.push(`  ${tokenNameToVar(t.name)}: ${resolveValue(t.value)};`);
    }
    lines.push(`  /* – ${docLabel}: surface neutrals – */`);
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
    const docLabel = colourSchemeMixes.get(id)?.label ?? label;
    lines.push(
      `/* [${escapeComment(docLabel)}] :root tokens → --brand-* / --neutral-* when data-color-scheme=\"${id}\" */`,
    );
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

  emitBrandNeutralMixRules(lines, SCHEME_HUE_DEFS, BRAND_STEPS, colourSchemeMixes);

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, `${lines.join("\n")}\n`, "utf8");
  console.error("Wrote", path.relative(APP_ROOT, OUT_FILE));
}

main();
