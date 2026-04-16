import express from "express";
import { authenticateApplication } from "./api/v1/middleware/authenticateApplication";
import { validateContentType } from "./api/v1/middleware/validateContentType";
import PredictionMonitor from "./domain/monitors/PredictionMonitor";
import { monitors } from "./domain/monitors/config";
import { seasonsManager } from "./domain/seasons/SeasonManager";

// Routers
import predictionsRouter from "./api/v1/routers/predictions";
import usersRouter from "./api/v1/routers/users";
import scoresRouter from "./api/v1/routers/scores";
import seasonsRouter from "./api/v1/routers/seasons";
import { apiV2Router } from "./api/v2";
import { createLogger } from "@mendahu/utilities";
import pool from "./data/db";

const logger = createLogger({ namespace: "NDB2", env: ["dev", "production"] });

// DB Test Connection
pool
  .connect()
  .then((client) => {
    client.release();
  })
  .catch((err) => {
    if (process.env.NODE_ENV === "dev") {
      logger.error("Failed to connect to database. Ensure Docker is running.");
      process.exit(1);
    }
    logger.error("Failed to connect to database: ", err);
    process.exit(1);
  });

const app = express();

// Configuration
const PORT = process.env.PORT || 80;
if (process.env.NODE_ENV === "dev") {
  (async () => {
    const morgan = (await import("morgan")).default;
    app.use(morgan("dev"));
  })();
}
app.use(express.json());

app.use(validateContentType);

app.get("/health", (req, res) => {
  return res.status(200).json({ status: "healthy" });
});

const authenticatedRouter = express.Router();

// Authentication
authenticatedRouter.use(authenticateApplication);

// Routers
authenticatedRouter.use("/api/predictions", predictionsRouter);
authenticatedRouter.use("/api/users", usersRouter);
authenticatedRouter.use("/api/scores", scoresRouter);
authenticatedRouter.use("/api/seasons", seasonsRouter);

app.use(authenticatedRouter);

// V2
authenticatedRouter.use("/api/v2", apiV2Router);

app.get("*", (req, res) => {
  return res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  logger.log(`Application listening on port: ${PORT}`);
});

// Prediction Monitor Initialization
const monitor = new PredictionMonitor(monitors);
monitor.initiate();

// Seasons Manager Initialization
seasonsManager.initialize();
