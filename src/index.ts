import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { authenticateApplication } from "./middleware/authenticateApplication";
import { validateContentType } from "./middleware/validateContentType";
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
app.use(validateContentType);
app.use(authenticateApplication);

// API
app.use("/api", require("./routers/api"));

app.get("*", (req, res) => {
  return res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`[NDB2]: Application listening on port:`, PORT);
});

const monitor = new PredictionMonitor();
