import type { Server } from "node:http";
import { config } from "@config";
import { createLogger } from "@mendahu/utilities";
import {
  startDiscordGatewayClient,
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
import { createApp } from "./server/createApp";

const PORT = config.port;

const logger = createLogger({ namespace: "NDB2", env: ["dev", "production"] });

let httpServer: Server | undefined;
let shuttingDown = false;

function logFatal(label: string, err: unknown): void {
  if (err instanceof Error) {
    logger.error(label, {
      message: err.message,
      stack: err.stack,
    });
    return;
  }
  logger.error(label, { detail: String(err) });
}

async function bootstrap() {
  const app = await createApp();
  const portal = config.discord.webPortal;
  await startDiscordGatewayClient({
    token: portal.botToken,
    guildId: portal.guildId,
  });

  httpServer = app.listen(PORT, () => {
    logger.log(`Application listening on port: ${PORT}`);
  });

  const monitor = new PredictionMonitor(monitors);
  monitor.initiate();

  seasonsManager.initialize();

  const seasonMonitor = new SeasonMonitor(seasonMonitors);
  seasonMonitor.initiate();
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  logger.log(`Received ${signal}; shutting down…`);

  await stopDiscordGatewayClient();

  if (httpServer) {
    await new Promise<void>((resolve, reject) => {
      httpServer!.close((err) => (err ? reject(err) : resolve()));
    });
  }

  await closePool();
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
  registerShutdownHandlers();

  try {
    await waitForDatabase();
  } catch (err) {
    if (isDev()) {
      logFatal(
        "Failed to connect to database after retries. Ensure Docker is running and DATABASE_URL is set.",
        err,
      );
    } else {
      logFatal("Failed to connect to database after retries", err);
    }
    process.exit(1);
  }

  try {
    await bootstrap();
  } catch (err) {
    logFatal("Bootstrap failed", err);
    await closePool();
    process.exit(1);
  }
}

void main();
