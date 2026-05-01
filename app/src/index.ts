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
import pool from "@data/db";
import { isDev } from "@shared/utils";
import { createApp } from "./server/createApp";

const PORT = config.port;

const logger = createLogger({ namespace: "NDB2", env: ["dev", "production"] });

// DB Connection Test
pool
  .connect()
  .then((client) => {
    client.release();
  })
  .catch((err) => {
    if (isDev()) {
      logger.error("Failed to connect to database. Ensure Docker is running.");
      process.exit(1);
    }
    logger.error("Failed to connect to database: ", err);
    process.exit(1);
  });

async function bootstrap() {
  const app = await createApp();
  const portal = config.discord.webPortal;
  await startDiscordGatewayClient({
    token: portal.botToken,
    guildId: portal.guildId,
  });

  app.listen(PORT, () => {
    logger.log(`Application listening on port: ${PORT}`);
  });

  const monitor = new PredictionMonitor(monitors);
  monitor.initiate();

  seasonsManager.initialize();

  const seasonMonitor = new SeasonMonitor(seasonMonitors);
  seasonMonitor.initiate();

  const shutdownDiscord = () => {
    void stopDiscordGatewayClient();
  };
  process.once("SIGINT", shutdownDiscord);
  process.once("SIGTERM", shutdownDiscord);
}

bootstrap().catch((err) => {
  logger.error(`Bootstrap failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
