import express from "express";
import { mapRoutes } from "@shared/routerMap";
import { themePreferenceMiddleware } from "../middleware/themePreferenceMiddleware";
import { SuspenseDemo } from "./demo/suspense/handler";
import { Home } from "./home/handler";

export const webRouter = express.Router();

webRouter.use(themePreferenceMiddleware);
webRouter.use("/", mapRoutes([Home, SuspenseDemo]));
