import express from "express";
import { getAllSeasons } from "./routes/seasons/getAll";
import { getPredictionByIdHandler } from "./routes/predictions/getPredictionById";
import { mapRoutes } from "./utils/routerMap";

export const apiV2Router = express.Router();

apiV2Router.use("/seasons", mapRoutes([getAllSeasons]));
apiV2Router.use("/predictions", mapRoutes([getPredictionByIdHandler]));
