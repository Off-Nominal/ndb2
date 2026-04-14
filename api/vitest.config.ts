import { defineConfig } from "vitest/config";

/**
 * Default `pnpm test` runs unit + integration (integration needs Postgres).
 * Use `vitest.unit.config.ts` / `vitest.integration.config.ts` to run one suite.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.integration.test.ts"],
    globals: true,
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
