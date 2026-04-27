#!/usr/bin/env node
/**
 * Discovers `*.client.ts` and `*.client.js` under:
 * - `src/web/routes/`, and
 * - `src/web/shared/components/`,
 * emits `*.client.js` into `dist/web/public/routes/...` (served as `/assets/routes/...`),
 * and generates `src/web/generated/routeClientScripts.ts`.
 *
 * - `*.client.ts` → bundled with **Vite** (browser, `iife`, `es2020`); no Node `tsc`.
 * - `*.client.js` → copied as-is.
 *
 * Handlers: `clientScriptsForModule` for route colocated scripts; `HtmlHead` also loads
 * `sharedComponentsClientScriptUrls` (all `*.client.ts` / `*.client.js` under `shared/components/`).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(__dirname, "..");
const WEB_ROOT = path.join(APP_ROOT, "src/web");
const ROUTES_DIR = path.join(WEB_ROOT, "routes");
const SHARED_COMPONENTS_DIR = path.join(WEB_ROOT, "shared", "components");
const PUBLIC_ROUTES_CLIENT = path.join(APP_ROOT, "dist/web/public/routes");
const GEN_FILE = path.join(APP_ROOT, "src/web/generated/routeClientScripts.ts");

function die(msg) {
  console.error(msg);
  process.exit(1);
}

/** @param {string} name */
function isClientFile(name) {
  return name.endsWith(".client.ts") || name.endsWith(".client.js");
}

/** @param {string} dir */
function collectClientFilesRecursive(dir) {
  /** @type {string[]} */
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...collectClientFilesRecursive(p));
    else if (ent.isFile() && isClientFile(ent.name)) out.push(p);
  }
  return out;
}

/** @returns {Array<{ abs: string, relUnderPublicRoutes: string, kind: 'ts' | 'js' }>} */
function collectAllClientSources() {
  /** @type {Array<{ abs: string, relUnderPublicRoutes: string, kind: 'ts' | 'js' }>} */
  const out = [];

  if (fs.existsSync(ROUTES_DIR)) {
    for (const abs of collectClientFilesRecursive(ROUTES_DIR)) {
      const rel = path.relative(ROUTES_DIR, abs).split(path.sep).join("/");
      const isTs = rel.endsWith(".ts");
      out.push({
        abs,
        relUnderPublicRoutes: isTs ? rel.replace(/\.ts$/, ".js") : rel,
        kind: isTs ? "ts" : "js",
      });
    }
  } else {
    die(`Missing routes dir: ${ROUTES_DIR}`);
  }

  if (fs.existsSync(SHARED_COMPONENTS_DIR)) {
    for (const abs of collectClientFilesRecursive(SHARED_COMPONENTS_DIR)) {
      const rel = path
        .join("shared", "components", path.relative(SHARED_COMPONENTS_DIR, abs))
        .split(path.sep)
        .join("/");
      const isTs = rel.endsWith(".ts");
      out.push({
        abs,
        relUnderPublicRoutes: isTs ? rel.replace(/\.ts$/, ".js") : rel,
        kind: isTs ? "ts" : "js",
      });
    }
  }

  return out.sort((a, b) => a.relUnderPublicRoutes.localeCompare(b.relUnderPublicRoutes));
}

async function main() {
  fs.mkdirSync(path.dirname(GEN_FILE), { recursive: true });
  fs.rmSync(PUBLIC_ROUTES_CLIENT, { recursive: true, force: true });

  const sources = collectAllClientSources();
  const tsSources = sources.filter((s) => s.kind === "ts");

  const viteClientConfig = {
    configFile: false,
    root: APP_ROOT,
    publicDir: false,
    logLevel: "warn",
    resolve: {
      alias: { "@web": path.join(APP_ROOT, "src/web") },
    },
  };

  for (const { abs, relUnderPublicRoutes } of tsSources) {
    const dest = path.join(PUBLIC_ROUTES_CLIENT, relUnderPublicRoutes);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const entryName = path.basename(dest, ".js");

    await build({
      ...viteClientConfig,
      build: {
        target: "es2020",
        outDir: path.dirname(dest),
        emptyOutDir: false,
        minify: false,
        chunkSizeWarningLimit: 100000,
        rollupOptions: {
          input: { [entryName]: path.resolve(abs) },
          output: {
            format: "iife",
            dir: path.dirname(dest),
            entryFileNames: "[name].js",
          },
        },
      },
    });

    console.error("Wrote", path.join("dist/web/public/routes", relUnderPublicRoutes));
  }

  for (const { abs, relUnderPublicRoutes, kind } of sources) {
    if (kind === "js") {
      const dest = path.join(PUBLIC_ROUTES_CLIENT, relUnderPublicRoutes);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(abs, dest);
      console.error("Wrote", path.relative(APP_ROOT, dest));
    }
  }

  /** @type {Map<string, string[]>} */
  const byDir = new Map();
  for (const { relUnderPublicRoutes } of sources) {
    const dirKey = path.posix.dirname(relUnderPublicRoutes);
    const urlPath = `/assets/routes/${relUnderPublicRoutes}`;
    const list = byDir.get(dirKey) ?? [];
    list.push(urlPath);
    byDir.set(dirKey, list);
  }

  /** @type {string[]} */
  const sharedComponentsUrls = [];
  const sharedPrefix = "shared/components/";
  for (const { relUnderPublicRoutes } of sources) {
    if (relUnderPublicRoutes.startsWith(sharedPrefix) && relUnderPublicRoutes.endsWith(".client.js")) {
      sharedComponentsUrls.push(`/assets/routes/${relUnderPublicRoutes}`);
    }
  }

  const keys = [...byDir.keys()].sort((a, b) => a.localeCompare(b));
  const lines = [];
  lines.push("/**");
  lines.push(" * Route colocated client scripts → `/assets/routes/...` URLs.");
  lines.push(" * Generated by scripts/build-client-js.mjs — do not edit by hand.");
  lines.push(" */");
  lines.push("");
  lines.push("export const routeClientScripts = {");

  for (const k of keys) {
    const urls = byDir.get(k);
    if (!urls) continue;
    const inner = urls.map((u) => JSON.stringify(u)).join(", ");
    lines.push(`  ${JSON.stringify(k)}: [${inner}] as const,`);
  }

  lines.push("} as const;");
  lines.push("");
  lines.push("/**");
  lines.push(
    " * All `src/web/shared/components/**` `*.client.*` (after build → `.client.js`).",
  );
  lines.push(" * `HtmlHead` prepends these before optional route `clientScripts`.");
  lines.push(" */");
  lines.push("export const sharedComponentsClientScriptUrls = [");
  for (const u of sharedComponentsUrls) {
    lines.push(`  ${JSON.stringify(u)},`);
  }
  lines.push("] as const;");
  lines.push("");
  lines.push("export type RouteClientScriptBundleKey = keyof typeof routeClientScripts;");
  lines.push("");
  lines.push(
    "export function clientScriptsForRouteDir(dir: string): readonly string[] {",
  );
  lines.push(
    "  const map = routeClientScripts as Record<string, readonly string[]>;",
  );
  lines.push("  return map[dir] ?? [];");
  lines.push("}");
  lines.push("");

  fs.writeFileSync(GEN_FILE, lines.join("\n"), "utf8");
  console.error("Wrote", path.relative(APP_ROOT, GEN_FILE));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
