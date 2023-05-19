import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { authenticateApplication } from "./middleware/authenticateApplication";
import PredictionMonitor from "./classes/PredictionMonitor";

const app = express();

// Configuration
const PORT = process.env.PORT || 80;
if (process.env.NODE_ENV === "dev") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
}
app.use(express.json());

// Authentication
app.use(authenticateApplication);

// Routers
import predictionsRouter from "./routers/predictions";
app.use("/api/predictions", predictionsRouter);

import usersRouter from "./routers/users";
app.use("/api/users", usersRouter);

import scoresRouter from "./routers/scores";
app.use("/api/scores", scoresRouter);

app.get("*", (req, res) => {
  return res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`[NDB2]: Application listeneing on port: `, PORT);
});

const monitor = new PredictionMonitor();
