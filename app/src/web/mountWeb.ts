import fs from "node:fs";
import path from "node:path";
import express, { type Express } from "express";
import { webRouter } from "./routes/index";

/** Build output and vendored static files; `app/src/web/public` is static-only and merged here. */
const WEB_PUBLIC_SENTINEL = "cube.css";

function resolveWebPublicRoot(): string {
  const besideModule = path.join(__dirname, "public");
  if (fs.existsSync(path.join(besideModule, WEB_PUBLIC_SENTINEL))) {
    return besideModule;
  }
  const fromAppDist = path.join(
    __dirname,
    "..",
    "..",
    "dist",
    "web",
    "public",
  );
  if (fs.existsSync(path.join(fromAppDist, WEB_PUBLIC_SENTINEL))) {
    return fromAppDist;
  }
  throw new Error(
    "Web public assets are missing. From the `app` package, run: pnpm run prepare-dev " +
      "(or pnpm run build:tokens, build:css, build:client-js, vendor-htmx, transfer-web) " +
      "so `cube.css` exists under `dist/web/public/`.",
  );
}

export function mountWeb(app: Express): void {
  app.use("/assets", express.static(resolveWebPublicRoot()));

  app.use(webRouter);
}
