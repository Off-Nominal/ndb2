import type { Server } from "node:http";
import { config } from "@config";
import { createLogger } from "@mendahu/utilities";
import {
  connectDiscordGatewayInBackground,
  stopDiscordGatewayClient,
} from "@domain/discord";
import PredictionMonitor from "@domain/predictions/prediction-monitor";
import { monitors } from "@domain/predictions/config";
import SeasonMonitor from "@domain/seasons/season-monitor";
import { monitors as seasonMonitors } from "@domain/seasons/config";
import { seasonsManager } from "@domain/seasons/season-manager";
import { closePool } from "@data/db";
import { waitForDatabase } from "@data/db/wait-for-database";
import { isDev } from "@shared/utils";
import { logStartup, logStartupError } from "@shared/startup-log";
import { createApp } from "./server/createApp";
import { markReady, markStartupFailed } from "./server/readiness";

const PORT = config.port;

const logger = createLogger({
  namespace: "NDB2",
  env: ["dev", "development", "production"],
});

let httpServer: Server | undefined;
let shuttingDown = false;

function logFatal(label: string, err: unknown): void {
  logStartupError(label, err);
  if (err instanceof Error) {
    logger.error(label, {
      message: err.message,
      stack: err.stack,
    });
    return;
  }
  logger.error(label, { detail: String(err) });
}

function startBackgroundServices() {
  const monitor = new PredictionMonitor(monitors);
  monitor.initiate();

  seasonsManager.initialize();

  const seasonMonitor = new SeasonMonitor(seasonMonitors);
  seasonMonitor.initiate();

  const portal = config.discord.webPortal;
  connectDiscordGatewayInBackground({
    token: portal.botToken,
    guildId: portal.guildId,
  });
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  logStartup(`Received ${signal}; shutting down…`);
  logger.log(`Received ${signal}; shutting down…`);

  await stopDiscordGatewayClient();

  if (httpServer) {
    await new Promise<void>((resolve, reject) => {
      httpServer!.close((err) => (err ? reject(err) : resolve()));
    });
  }

  await closePool();
  logStartup("Shutdown complete");
  logger.log("Shutdown complete");
  process.exit(0);
}

function registerShutdownHandlers(): void {
  const onSignal = (signal: string) => {
    void shutdown(signal).catch((err) => {
      logFatal(`Shutdown failed after ${signal}`, err);
      process.exit(1);
    });
  };

  process.once("SIGINT", () => onSignal("SIGINT"));
  process.once("SIGTERM", () => onSignal("SIGTERM"));
}

async function main(): Promise<void> {
  logStartup(
    `Booting (NODE_ENV=${process.env.NODE_ENV ?? "(unset)"}, port=${PORT})`,
  );
  registerShutdownHandlers();

  const app = await createApp();
  httpServer = app.listen(PORT, () => {
    logStartup(`Listening on port ${PORT} (waiting for database)`);
    logger.log(`Application listening on port: ${PORT}`);
  });
  httpServer.on("error", (err) => {
    logFatal("HTTP server failed to start", err);
    void closePool().finally(() => process.exit(1));
  });

  try {
    await waitForDatabase();
    logStartup("Database ready; starting monitors and Discord gateway");
    startBackgroundServices();
    markReady();
    logStartup("Ready");
    logger.log("Application ready");
  } catch (err) {
    const label = isDev()
      ? "Failed to connect to database after retries. Ensure Docker is running and DATABASE_URL is set."
      : "Startup failed";
    const message = err instanceof Error ? err.message : String(err);
    markStartupFailed(message);
    logFatal(label, err);
    await closePool();
    process.exit(1);
  }
}

void main();
