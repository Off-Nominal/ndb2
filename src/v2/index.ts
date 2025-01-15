import express from "express";
import { getAllSeasons } from "./routers/seasons/getAll";
import { getPredictionByIdHandler } from "./routers/predictions/getPredictionById";
import { routerMap } from "./utils/routerMap";

export const apiV2Router = express.Router();

apiV2Router.use("/seasons", routerMap([getAllSeasons]));
apiV2Router.use("/predictions", routerMap([getPredictionByIdHandler]));
