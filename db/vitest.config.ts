import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "./src/test/global-setup.ts",
    globals: true,
    environment: "node",
    // Default Vitest globs match both src and emitted dist/*.test.js; run source tests only.
    include: ["src/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
