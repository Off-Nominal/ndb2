import path from "node:path";

const appRoot = path.resolve(__dirname);

/** Vite/Vitest resolve aliases (must match tsconfig `paths`). */
export const vitestResolve = {
  alias: {
    "@config": path.join(appRoot, "src/config.ts"),
    "@shared": path.join(appRoot, "src/shared"),
    "@data": path.join(appRoot, "src/data"),
    "@domain": path.join(appRoot, "src/domain"),
    "@web": path.join(appRoot, "src/web"),
  },
};
