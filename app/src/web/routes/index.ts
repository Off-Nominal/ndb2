import express from "express";
import { mapRoutes } from "@shared/routerMap";
import { requireWebAuth } from "../middleware/requireWebAuth";
import { themePreferenceMiddleware } from "../middleware/themePreferenceMiddleware";
import { webAuthMiddleware } from "../middleware/webAuthMiddleware";
import { DiscordAuth } from "./auth/discord/handler";
import { SuspenseDemo } from "./demo/suspense/handler";
import { Home } from "./home/handler";

export const webRouter = express.Router();

webRouter.use(themePreferenceMiddleware);
webRouter.use(webAuthMiddleware);
webRouter.use("/demo", requireWebAuth);
webRouter.use("/", mapRoutes([DiscordAuth, Home, SuspenseDemo]));
