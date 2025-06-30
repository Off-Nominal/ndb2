if (process.env.NODE_ENV !== "production") {
  console.log("Loading .env file");
  require("dotenv").config();
}

import express from "express";
import { authenticateApplication } from "./middleware/authenticateApplication";
import { validateContentType } from "./middleware/validateContentType";
import PredictionMonitor from "./classes/PredictionMonitor";
import { monitors } from "./config/monitors";
import { seasonsManager } from "./classes/SeasonManager";
import { createLogger } from "./utils/logger";

// Routers
import predictionsRouter from "./routers/predictions";
import usersRouter from "./routers/users";
import scoresRouter from "./routers/scores";
import seasonsRouter from "./routers/seasons";
import { apiV2Router } from "./v2";

const logger = createLogger("NDB2");

const app = express();

// Configuration
const PORT = process.env.PORT || 80;
if (process.env.NODE_ENV === "dev") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
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
