/**
 * Concatenate CSS class strings for Kitajs `class` attributes (CUBE bracket groups + extras).
 * Returns `base` when `extra` is missing or empty to avoid a trailing space.
 */
export function mergeClass(base: string, extra: string | undefined): string {
  return extra != null && extra.length > 0 ? `${base} ${extra}` : base;
}
