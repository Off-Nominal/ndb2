/** Thousands separators in en-US locale; decimals use up to 2 fraction digits unless the value is an integer. */
export function formatNumber(value: number): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  });
}
