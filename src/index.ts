import express from "express";
import { authenticateApplication } from "./middleware/authenticateApplication";
import { validateContentType } from "./middleware/validateContentType";
import PredictionMonitor from "./classes/PredictionMonitor";
import { monitors } from "./config/monitors";
import { seasonsManager } from "./classes/SeasonManager";

// Routers
import predictionsRouter from "./routers/predictions";
import usersRouter from "./routers/users";
import scoresRouter from "./routers/scores";
import seasonsRouter from "./routers/seasons";

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
autheticatedRouter.use("/api/predictions", predictionsRouter);
autheticatedRouter.use("/api/users", usersRouter);
autheticatedRouter.use("/api/scores", scoresRouter);
autheticatedRouter.use("/api/seasons", seasonsRouter);

app.use(autheticatedRouter);

app.get("*", (req, res) => {
  return res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`[NDB2]: Application listening on port:`, PORT);
});

// Prediction Monitor Initialization
const monitor = new PredictionMonitor(monitors);
monitor.initiate();

// Seasons Manager Initialization
seasonsManager.initialize();
