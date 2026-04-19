import type { Express } from "express";
import helmet from "helmet";
import { isProduction } from "@shared/utils";

/**
 * Express must trust the reverse proxy (e.g. Coolify’s Traefik) so `req.secure`,
 * `req.ip`, and `X-Forwarded-*` match the client TLS hop.
 *
 * - **Production:** defaults to trusting the first proxy hop (`trust proxy = 1`), which
 *   matches a typical Traefik → container setup.
 * - **Opt out:** set `TRUST_PROXY=0` or `false` if this process is exposed directly
 *   without a proxy (rare).
 * - **Override hop count:** set `TRUST_PROXY` to `1`, `true`, or a positive integer
 *   (same behavior in all environments).
 */
export function configureTrustProxy(app: Express): void {
  const raw = process.env.TRUST_PROXY?.trim();

  if (raw === "0" || raw === "false") {
    return;
  }
  if (raw === "1" || raw === "true") {
    app.set("trust proxy", 1);
    return;
  }
  if (raw && /^\d+$/.test(raw)) {
    app.set("trust proxy", Number.parseInt(raw, 10));
    return;
  }
  if (isProduction()) {
    app.set("trust proxy", 1);
  }
}

/**
 * Do **not** emit `Strict-Transport-Security` here. Terminate TLS at the proxy and set
 * HSTS there (e.g. Traefik `headers` middleware with `stsSeconds` in Coolify) so the
 * policy exists once at the edge and is not duplicated by Node.
 */
export function installSecurityHeaders(app: Express): void {
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "data:"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          scriptSrcAttr: ["'none'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      strictTransportSecurity: false,
      xFrameOptions: { action: "deny" },
    }),
  );
}
