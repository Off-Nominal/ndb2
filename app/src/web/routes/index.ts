import express from "express";
import { mapRoutes } from "@shared/routerMap";
import { SuspenseDemo } from "./demo/suspense/handler";
import { Home } from "./home/handler";

export const webRouter = express.Router();

webRouter.use("/", mapRoutes([Home, SuspenseDemo]));
