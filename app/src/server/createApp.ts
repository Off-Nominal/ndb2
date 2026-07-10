import path from "node:path";
import express, { type Express } from "express";
import pool from "@data/db";
import { isDiscordGatewayReady } from "@domain/discord";
import { isDev } from "@shared/utils";
import { logStartup, logStartupError } from "@shared/startup-log";
import { mountJsonApi } from "../api/mountJsonApi";
import { mountWeb } from "../web/mountWeb";
import { getReadiness } from "./readiness";
import { configureTrustProxy, installSecurityHeaders } from "./securityHeaders";

/** Package root (`ndb2/app`). Requires dev/prod commands to run with cwd = this package (pnpm scripts do). */
const appRootDir = process.cwd();

export async function createApp(): Promise<Express> {
  const app = express();

  configureTrustProxy(app);
  installSecurityHeaders(app);

  if (isDev()) {
    const { createServer } = await import("vite");
    const { viteDevAssetWatchPlugin } = await import("./vite-dev-asset-watch.js");
    const vite = await createServer({
      configFile: false,
      root: appRootDir,
      server: { middlewareMode: true },
      appType: "custom",
      resolve: {
        alias: { "@web": path.join(appRootDir, "src/web") },
      },
      plugins: [viteDevAssetWatchPlugin(appRootDir)],
    });
    app.use(vite.middlewares);
    const morgan = (await import("morgan")).default;
    app.use(morgan("dev"));
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.get("/health", async (req, res) => {
    const readiness = getReadiness();

    if (!readiness.ready) {
      if (readiness.error) {
        return res.status(503).json({
          status: "unhealthy",
          phase: "startup",
          error: readiness.error,
        });
      }
      return res.status(200).json({ status: "starting" });
    }

    try {
      await pool.query("SELECT 1");
      return res.status(200).json({
        status: "healthy",
        discord: isDiscordGatewayReady() ? "connected" : "connecting",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const code =
        err instanceof Error && "code" in err && typeof err.code === "string"
          ? err.code
          : undefined;
      return res.status(503).json({
        status: "unhealthy",
        phase: "runtime",
        database: { message, code },
      });
    }
  });

  mountWeb(app);
  /** JSON API is under `/api` only so `/assets/*` and HTML never run API auth middleware. */
  mountJsonApi(app);

  app.get("*", (req, res) => {
    return res.status(404).json({ error: "Not found" });
  });

  return app;
}

