import { randomBytes, randomUUID } from "node:crypto";

/** Opaque session id in cookie (UUID v4). */
export const SESSION_COOKIE_CONFIG = {
  name: "ndb2_session",
  path: "/",
  /** Session + cookie lifetime (seconds). */
  maxAgeSec: 60 * 60 * 24 * 30,
  sameSite: "Lax" as const,
} as const;

/** RFC 4122 UUID string (opaque session id from `randomUUID()`). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseSessionCookie(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  const escaped = SESSION_COOKIE_CONFIG.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  if (!match) return undefined;
  const raw = decodeURIComponent(match[1].trim());
  if (!UUID_RE.test(raw)) return undefined;
  return raw;
}

export function newSessionId(): string {
  return randomUUID();
}

export function newCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Set opaque session id; HttpOnly, SameSite=Lax; Secure in production. */
export function buildSessionPersistCookieHeader(sessionId: string): string {
  const c = SESSION_COOKIE_CONFIG;
  const parts = [
    `${c.name}=${encodeURIComponent(sessionId)}`,
    `Path=${c.path}`,
    `Max-Age=${c.maxAgeSec}`,
    "HttpOnly",
    `SameSite=${c.sameSite}`,
  ];
  if (isProduction()) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function buildSessionClearCookieHeader(): string {
  const c = SESSION_COOKIE_CONFIG;
  const parts = [
    `${c.name}=`,
    `Path=${c.path}`,
    "Max-Age=0",
    "HttpOnly",
    `SameSite=${c.sameSite}`,
  ];
  if (isProduction()) {
    parts.push("Secure");
  }
  return parts.join("; ");
}
