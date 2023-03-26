import dotenv from "dotenv";
dotenv.config();

import express from "express";
import morgan from "morgan";
import { authenticateApplication } from "./middleware/authenticateApplication";
import PredictionMonitor from "./classes/PredictionMonitor";

const app = express();

// Configuration

const PORT = process.env.PORT || 80;
if (process.env.NODE_ENV === "dev") {
  app.use(morgan("dev"));
}
app.use(express.json());

// Authentication
app.use(authenticateApplication);

// Routers
import predictionsRouter from "./routers/predictions";
app.use("/api/predictions", predictionsRouter);

app.listen(PORT, () => {
  console.log(`[NDB2]: Application listeneing on port: `, PORT);
});

const monitor = new PredictionMonitor();
