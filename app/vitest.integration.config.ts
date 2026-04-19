import { defineConfig } from "vitest/config";
import { vitestResolve } from "./vitest.shared";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "@kitajs/html",
  },
  resolve: vitestResolve,
  test: {
    name: "integration",
    include: ["src/**/*.integration.test.ts"],
    globals: true,
    globalSetup: "./src/test/global-setup.ts",
    setupFiles: ["./src/test/install-test-env.ts"],
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
