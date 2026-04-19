/**
 * Restrict open redirects after OAuth: only same-origin relative paths.
 * Rejects protocol-relative URLs and non-path values.
 */
export function safeReturnTo(raw: string | undefined, defaultPath = "/"): string {
  if (raw == null || typeof raw !== "string" || raw.length === 0) {
    return defaultPath;
  }
  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return defaultPath;
  }
  return raw;
}
