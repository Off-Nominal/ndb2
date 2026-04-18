import { defineConfig } from "vitest/config";
import { vitestResolve } from "./vitest.shared";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "@kitajs/html",
  },
  resolve: vitestResolve,
  test: {
    name: "unit",
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*.integration.test.ts"],
    globals: true,
    environment: "node",
  },
});
