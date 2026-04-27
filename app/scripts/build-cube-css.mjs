#!/usr/bin/env node
/**
 * 1) Regenerate cube-blocks manifest (sorted `@import` list).
 * 2) Vite build: `cube-entry.css` → `dist/web/public/cube.css`.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(__dirname, "..");

function pnpmNode(script) {
  const r = spawnSync(process.execPath, [path.join(__dirname, script)], {
    cwd: APP_ROOT,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function main() {
  pnpmNode("generate-cube-blocks-manifest.mjs");

  const entry = path.join(APP_ROOT, "src/web/styles/cube-bundle.ts");
  if (!fs.existsSync(entry)) {
    console.error("Missing", entry);
    process.exit(1);
  }

  const outDir = path.join(APP_ROOT, "dist/web/public");

  await build({
    configFile: false,
    root: APP_ROOT,
    publicDir: false,
    logLevel: "warn",
    resolve: {
      alias: { "@web": path.join(APP_ROOT, "src/web") },
    },
    build: {
      target: "es2020",
      outDir,
      emptyOutDir: false,
      minify: false,
      cssCodeSplit: false,
      rollupOptions: {
        input: entry,
        output: {
          format: "es",
          entryFileNames: "cube-bundle-[hash].js",
          assetFileNames: "cube[extname]",
        },
      },
    },
  });

  for (const name of fs.readdirSync(outDir)) {
    if (name.startsWith("cube-bundle-") && name.endsWith(".js")) {
      fs.unlinkSync(path.join(outDir, name));
    }
  }

  console.error("Wrote", path.relative(APP_ROOT, path.join(outDir, "cube.css")));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
