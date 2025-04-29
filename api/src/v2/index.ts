import express from "express";
import { getAllSeasons } from "./routes/seasons/getAll";
import { getPredictionByIdHandler } from "./routes/predictions/getPredictionById";
import { routerMap } from "./utils/routerMap";

export const apiV2Router = express.Router();

apiV2Router.use("/seasons", routerMap([getAllSeasons]));
apiV2Router.use("/predictions", routerMap([getPredictionByIdHandler]));
