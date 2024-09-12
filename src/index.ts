import express from "express";
import { authenticateApplication } from "./middleware/authenticateApplication";
import { validateContentType } from "./middleware/validateContentType";
import PredictionMonitor from "./classes/PredictionMonitor";
import { monitors } from "./config/monitors";

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

const autheticatedRouter = express.Router();

// Authentication
autheticatedRouter.use(authenticateApplication);

// Routers
import predictionsRouter from "./routers/predictions";
autheticatedRouter.use("/api/predictions", predictionsRouter);

import usersRouter from "./routers/users";
autheticatedRouter.use("/api/users", usersRouter);

import scoresRouter from "./routers/scores";
autheticatedRouter.use("/api/scores", scoresRouter);

import seasonsRouter from "./routers/seasons";

autheticatedRouter.use("/api/seasons", seasonsRouter);

app.use(autheticatedRouter);

app.get("*", (req, res) => {
  return res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`[NDB2]: Application listening on port:`, PORT);
});

// Prediction Monitor Initiation
const monitor = new PredictionMonitor(monitors);
monitor.initiate();
