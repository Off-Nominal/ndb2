#!/usr/bin/env node
/**
 * Dev-only watcher: rebuild static assets without restarting the API process.
 * - Token JSON → build:tokens + build:web-assets (merge static from src/web/public)
 * - Colocated / layer CSS → regenerate cube-blocks manifest + build:web-assets (Vite serves / HMR CSS in dev)
 * - *.client.ts|js under routes or shared/components → build:client-js, then bump
 *   src/index.ts mtime so tsx watch restarts and picks up generated routeClientScripts.ts.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chokidar from "chokidar";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(__dirname, "..");
const INDEX_TS = path.join(APP_ROOT, "src", "index.ts");

/** @param {string[]} args pnpm CLI args after `pnpm` */
function pnpm(args) {
  const r = spawnSync("pnpm", args, {
    cwd: APP_ROOT,
    stdio: "inherit",
    env: process.env,
  });
  if (r.error) {
    console.error(r.error);
    process.exit(1);
  }
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

/** @param {() => void} fn */
function debounce(fn, ms) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let t;
  return () => {
    clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}

function touchApiEntry() {
  const now = new Date();
  fs.utimesSync(INDEX_TS, now, now);
}

const onTokens = debounce(() => {
  console.error("[dev-watch-assets] tokens changed → build:tokens, build:web-assets");
  pnpm(["run", "build:tokens"]);
  pnpm(["run", "build:web-assets"]);
}, 150);

const onCss = debounce(() => {
  console.error("[dev-watch-assets] CSS changed → cube-blocks manifest, build:web-assets");
  const r = spawnSync(process.execPath, [path.join(__dirname, "generate-cube-blocks-manifest.mjs")], {
    cwd: APP_ROOT,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
  pnpm(["run", "build:web-assets"]);
}, 150);

const onClientJs = debounce(() => {
  console.error("[dev-watch-assets] *.client.js changed → build:client-js, API restart");
  pnpm(["run", "build:client-js"]);
  touchApiEntry();
}, 150);

const tokenWatcher = chokidar.watch("src/web/tokens/**/*.json", {
  cwd: APP_ROOT,
  ignoreInitial: true,
});

const cssWatcher = chokidar.watch("src/web/**/*.css", {
  cwd: APP_ROOT,
  ignored: ["**/public/**", "**/generated/**"],
  ignoreInitial: true,
});

const clientWatcher = chokidar.watch(
  [
    "src/web/routes/**/*.client.ts",
    "src/web/routes/**/*.client.js",
    "src/web/shared/components/**/*.client.ts",
    "src/web/shared/components/**/*.client.js",
  ],
  { cwd: APP_ROOT, ignoreInitial: true },
);

tokenWatcher.on("all", onTokens);
cssWatcher.on("all", onCss);
clientWatcher.on("all", onClientJs);

process.on("SIGINT", () => {
  void tokenWatcher.close();
  void cssWatcher.close();
  void clientWatcher.close();
  process.exit(0);
});

console.error("[dev-watch-assets] watching tokens, CSS, and *.client.js");
