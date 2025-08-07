import express from "express";
import { getAllSeasons } from "./routes/seasons/getAll";
import { getPredictionById } from "./routes/predictions/getPredictionById";
import { mapRoutes } from "./utils/routerMap";
import { errorHandler } from "./middleware/errorHandler";

export const apiV2Router = express.Router();

apiV2Router.use("/seasons", mapRoutes([getAllSeasons]));
apiV2Router.use("/predictions", mapRoutes([getPredictionById]));

// Error handling middleware - must be last
apiV2Router.use(errorHandler);
