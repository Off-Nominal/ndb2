import { config } from "@config";

/** True when `NODE_ENV` is `production` (e.g. deploy / `pnpm compile`). */
export function isProduction(): boolean {
  return config.nodeEnv === "production";
}

/** True when `NODE_ENV` is `dev` (local `pnpm dev` / `tsx watch`). */
export function isDev(): boolean {
  return (
    config.nodeEnv === "dev" || config.nodeEnv === "development"
  );
}

/** True when `NODE_ENV` is `test` (Vitest / integration tests). */
export function isTest(): boolean {
  return config.nodeEnv === "test";
}
