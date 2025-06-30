import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "./src/test/global-setup.ts",
    globals: true,
    environment: "node",
  },
});
