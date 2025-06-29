import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    globals: true,
    globalSetup: "./src/test/global-setup.ts",
    environment: "node",
    testTimeout: 30000, // 30 seconds for database operations
    hookTimeout: 30000, // 30 seconds for setup/teardown
  },
});
