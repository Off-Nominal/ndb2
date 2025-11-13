import express from "express";
import { getAllSeasons } from "./routes/seasons/getAll";
import { getPredictionById } from "./routes/predictions/get_predictions_{predictionId}";
import { untriggerPredictionById } from "./routes/predictions/delete_predictions_{predictionId}";
import { retirePredictionById } from "./routes/predictions/patch_predictions_{predictionId}_retire";
import { mapRoutes } from "./utils/routerMap";
import { errorHandler } from "./middleware/errorHandler";
import "./managers/webhooks"; // Initialize webhook event listeners

export const apiV2Router = express.Router();

apiV2Router.use("/seasons", mapRoutes([getAllSeasons]));
apiV2Router.use(
  "/predictions",
  mapRoutes([getPredictionById, untriggerPredictionById, retirePredictionById])
);

// Error handling middleware - must be last
apiV2Router.use(errorHandler);
