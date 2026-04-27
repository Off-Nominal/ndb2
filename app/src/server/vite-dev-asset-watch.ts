import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import chokidar from "chokidar";

/**
 * Dev-only: same behavior as the former `scripts/dev-watch-assets.mjs`, running inside the
 * Vite middleware process so we do not need a second watcher + concurrently.
 */
export function viteDevAssetWatchPlugin(appRoot: string) {
  return {
    name: "ndb2-dev-asset-watch",
    apply: "serve" as const,
    configureServer() {
      const indexTs = path.join(appRoot, "src", "index.ts");
      const scriptsDir = path.join(appRoot, "scripts");

      function pnpm(args: string[]) {
        const r = spawnSync("pnpm", args, {
          cwd: appRoot,
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

      function debounce(fn: () => void, ms: number) {
        let t: ReturnType<typeof setTimeout> | undefined;
        return () => {
          clearTimeout(t);
          t = setTimeout(fn, ms);
        };
      }

      function touchApiEntry() {
        const now = new Date();
        fs.utimesSync(indexTs, now, now);
      }

      const onTokens = debounce(() => {
        console.error(
          "[vite-dev-asset-watch] tokens changed → build:tokens, build:web-assets",
        );
        pnpm(["run", "build:tokens"]);
        pnpm(["run", "build:web-assets"]);
      }, 150);

      const onCss = debounce(() => {
        console.error(
          "[vite-dev-asset-watch] CSS changed → cube-blocks manifest, build:web-assets",
        );
        const r = spawnSync(
          process.execPath,
          [path.join(scriptsDir, "generate-cube-blocks-manifest.mjs")],
          { cwd: appRoot, stdio: "inherit", env: process.env },
        );
        if (r.status !== 0) {
          process.exit(r.status ?? 1);
        }
        pnpm(["run", "build:web-assets"]);
      }, 150);

      const onClientJs = debounce(() => {
        console.error(
          "[vite-dev-asset-watch] *.client.* changed → build:client-js, API restart",
        );
        pnpm(["run", "build:client-js"]);
        touchApiEntry();
      }, 150);

      const tokenWatcher = chokidar.watch("src/web/tokens/**/*.json", {
        cwd: appRoot,
        ignoreInitial: true,
      });

      const cssWatcher = chokidar.watch("src/web/**/*.css", {
        cwd: appRoot,
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
        { cwd: appRoot, ignoreInitial: true },
      );

      tokenWatcher.on("all", onTokens);
      cssWatcher.on("all", onCss);
      clientWatcher.on("all", onClientJs);

      console.error(
        "[vite-dev-asset-watch] watching tokens, CSS, and *.client.* (via Vite)",
      );

      return () => {
        void tokenWatcher.close();
        void cssWatcher.close();
        void clientWatcher.close();
      };
    },
  };
}
