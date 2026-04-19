import express, { type Express } from "express";
import { authenticateApplication } from "./v1/middleware/authenticateApplication";
import { validateContentType } from "./v1/middleware/validateContentType";
import predictionsRouter from "./v1/routers/predictions";
import usersRouter from "./v1/routers/users";
import scoresRouter from "./v1/routers/scores";
import seasonsRouter from "./v1/routers/seasons";
import { apiV2Router } from "./v2";

/** API-key JSON surface (v1 + v2). Mounted only under `/api` so auth and JSON checks do not run for `/`, `/assets/*`, etc. */
export function mountJsonApi(app: Express): void {
  const api = express.Router();

  api.use(validateContentType);
  api.use(authenticateApplication);

  // v1 API — full paths remain /api/predictions, /api/users, …
  api.use("/predictions", predictionsRouter);
  api.use("/users", usersRouter);
  api.use("/scores", scoresRouter);
  api.use("/seasons", seasonsRouter);

  // v2 API — full path /api/v2/…
  api.use("/v2", apiV2Router);

  app.use("/api", api);
}
