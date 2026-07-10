import type { Request } from "express";

/** CSRF token from form body or `X-CSRF-Token` header (HTMX uses body `hx-headers`). */
export function getWebCsrfTokenFromRequest(req: Request): string | undefined {
  const body = req.body as { _csrf?: string } | undefined;
  const headerToken =
    typeof req.headers["x-csrf-token"] === "string"
      ? req.headers["x-csrf-token"]
      : undefined;
  return body?._csrf ?? headerToken;
}

/** True when the request includes the expected session CSRF token. */
export function assertWebCsrf(req: Request, expectedToken: string): boolean {
  const token = getWebCsrfTokenFromRequest(req);
  return token === expectedToken;
}
