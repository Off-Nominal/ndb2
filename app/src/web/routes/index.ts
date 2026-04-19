import express from "express";
import { mapRoutes } from "@shared/routerMap";
import { webAuthMiddleware } from "../middleware/auth/session";
import { requireWebAuth } from "../middleware/auth/require-auth";
import { themePreferenceMiddleware } from "../middleware/theme-preference";
import { webNotFoundMiddleware } from "../middleware/not-found";
import { webErrorHandler } from "../middleware/error-boundary";
import { DiscordAuth } from "./auth/discord/handler";
import { SuspenseDemo } from "./demo/suspense/handler";
import { Home } from "./home/handler";
import { Login } from "./login/handler";

export const webRouter = express.Router();

webRouter.use(themePreferenceMiddleware);
webRouter.use(webAuthMiddleware);
webRouter.use("/demo", requireWebAuth);
webRouter.use("/", mapRoutes([DiscordAuth, Login, Home, SuspenseDemo]));
webRouter.use(webNotFoundMiddleware);
webRouter.use(webErrorHandler);
