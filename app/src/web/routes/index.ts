import express from "express";
import { mapRoutes } from "@shared/routerMap";
import { Home } from "./home/get";

export const webRouter = express.Router();

webRouter.use("/", mapRoutes([Home]));
