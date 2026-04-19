import { randomBytes } from "node:crypto";
import { z } from "zod";
import { isProduction } from "@shared/utils";

/** Opaque session id in cookie (UUID from `randomUUID()` in session insert). */
export const SESSION_COOKIE_CONFIG = {
  name: "ndb2_session",
  path: "/",
  /** Session + cookie lifetime (seconds). */
  maxAgeSec: 60 * 60 * 24 * 30,
  sameSite: "Lax" as const,
} as const;

const sessionCookieValueSchema = z.uuid();

export function parseSessionCookie(
  cookieHeader: string | undefined,
): string | undefined {
  if (!cookieHeader) return undefined;
  const escaped = SESSION_COOKIE_CONFIG.name.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  if (!match) return undefined;
  const raw = decodeURIComponent(match[1].trim());
  const parsed = sessionCookieValueSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

export function newCsrfToken(): string {
  return randomBytes(32).toString("base64url");
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
