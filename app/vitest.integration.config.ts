import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "integration",
    include: ["src/**/*.integration.test.ts"],
    globals: true,
    globalSetup: "./src/test/global-setup.ts",
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
