import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "unit",
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*.integration.test.ts"],
    globals: true,
    environment: "node",
  },
});
