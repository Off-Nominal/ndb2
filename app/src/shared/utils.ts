/** True when `NODE_ENV` is `production` (e.g. deploy / `pnpm compile`). */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** True when `NODE_ENV` is `dev` (local `pnpm dev` / nodemon). */
export function isDev(): boolean {
  return (
    process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "development"
  );
}

/** True when `NODE_ENV` is `test` (Vitest / integration tests). */
export function isTest(): boolean {
  return process.env.NODE_ENV === "test";
}
