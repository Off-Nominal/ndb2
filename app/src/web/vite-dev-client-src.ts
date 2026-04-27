import fs from "node:fs";
import path from "node:path";
import { isDev } from "@shared/utils";

/** `ndb2/app` — requires cwd = package root (pnpm / normal dev start). */
const APP_ROOT = process.cwd();
const SRC_WEB = path.join(APP_ROOT, "src", "web");

const ASSET_ROUTES_PREFIX = "/assets/routes/";

/** CUBE bundle: Vite-served entry in dev (CSS HMR), built `/assets/cube.css` in prod. */
export function cubeStylesheetHref(): string {
  return isDev() ? "/src/web/styles/cube-entry.css" : "/assets/cube.css";
}

export type BrowserClientScriptTagProps = {
  src: string;
  /** When true, load as `type="module"` (Vite dev); classic scripts use `defer`. */
  typeModule: boolean;
};

/**
 * Resolves `/assets/routes/...` to a Vite-served `/src/web/...` module URL in dev when a
 * matching `*.client.ts` exists; otherwise falls back to the asset URL (classic `defer`).
 */
export function browserClientScriptTagProps(assetUrl: string): BrowserClientScriptTagProps {
  if (!isDev()) {
    return { src: assetUrl, typeModule: false };
  }

  const rel =
    assetUrl.startsWith(ASSET_ROUTES_PREFIX) ? assetUrl.slice(ASSET_ROUTES_PREFIX.length) : assetUrl;

  const underRoutes = rel.startsWith("shared/")
    ? path.join(SRC_WEB, rel)
    : path.join(SRC_WEB, "routes", rel);

  const tsCandidate = underRoutes.replace(/\.js$/, ".ts");
  if (fs.existsSync(tsCandidate)) {
    const posixRel = path.relative(SRC_WEB, tsCandidate).split(path.sep).join("/");
    return { src: `/src/web/${posixRel}`, typeModule: true };
  }

  if (fs.existsSync(underRoutes)) {
    const posixRel = path.relative(SRC_WEB, underRoutes).split(path.sep).join("/");
    return { src: `/src/web/${posixRel}`, typeModule: true };
  }

  return { src: assetUrl, typeModule: false };
}
