/**
 * Palette ids (`data-color-scheme` / `ndb2_color_scheme`) and user-facing names.
 * Keep in sync with `scheme.*` / `scheme.*.neutral.*` in `colors.json`, **`colour-schemes.json`**
 * (id + human **label** / **description** + brand softening), and **`build-design-tokens.mjs`**
 * (it parses this module for ids + labels in generated CSS comments for primitives).
 */
export const SCHEME_HUE_DEFS = [
  { id: "neptune" as const, label: "Neptune Blue" },
  { id: "aurora" as const, label: "Aurora Green" },
  { id: "helios" as const, label: "Helios Yellow" },
  { id: "nebula" as const, label: "Nebula Purple" },
  { id: "redshift" as const, label: "Redshift Red" },
  { id: "titan" as const, label: "Titan Orange" },
] as const;

export type ColorScheme = (typeof SCHEME_HUE_DEFS)[number]["id"];
