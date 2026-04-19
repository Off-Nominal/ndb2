import { createLogger } from "@mendahu/utilities";
import PredictionMonitor from "@domain/predictions/PredictionMonitor";
import { monitors } from "@domain/predictions/config";
import SeasonMonitor from "@domain/seasons/SeasonMonitor";
import { monitors as seasonMonitors } from "@domain/seasons/config";
import { seasonsManager } from "@domain/seasons/SeasonManager";
import pool from "@data/db";
import { isDev } from "@shared/utils";
import { createApp } from "./server/createApp";

// Config
const PORT = process.env.PORT || 80;

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

const app = createApp();

app.listen(PORT, () => {
  logger.log(`Application listening on port: ${PORT}`);
});

// Initialize Game
const monitor = new PredictionMonitor(monitors);
monitor.initiate();

seasonsManager.initialize();

const seasonMonitor = new SeasonMonitor(seasonMonitors);
seasonMonitor.initiate();
