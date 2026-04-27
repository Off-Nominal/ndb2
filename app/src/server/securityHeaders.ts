import type { TrustProxyResolved } from "@config";
import { config } from "@config";
import type { Express } from "express";
import helmet from "helmet";
import { isDev } from "@shared/utils";

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
 *
 * Pass `trustProxy` to override the resolved value from `@config` (e.g. tests with
 * {@link resolveTrustProxy}).
 */
export function configureTrustProxy(
  app: Express,
  trustProxy: TrustProxyResolved = config.server.trustProxy,
): void {
  if (trustProxy.apply) {
    app.set("trust proxy", trustProxy.hops);
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
      /** Vite injects `@vite/client` and eval-based HMR; disable CSP in local dev only. */
      contentSecurityPolicy: isDev()
        ? false
        : {
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
