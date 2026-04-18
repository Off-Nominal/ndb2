import express, { type Express } from "express";
import { authenticateApplication } from "./v1/middleware/authenticateApplication";
import { validateContentType } from "./v1/middleware/validateContentType";
import predictionsRouter from "./v1/routers/predictions";
import usersRouter from "./v1/routers/users";
import scoresRouter from "./v1/routers/scores";
import seasonsRouter from "./v1/routers/seasons";
import { apiV2Router } from "./v2";

/** API-key JSON surface (v1 + v2). Scoped middleware does not run on HTML routes. */
export function mountJsonApi(app: Express): void {
  const api = express.Router();

  api.use(validateContentType);
  api.use(authenticateApplication);

  // v1 API
  api.use("/api/predictions", predictionsRouter);
  api.use("/api/users", usersRouter);
  api.use("/api/scores", scoresRouter);
  api.use("/api/seasons", seasonsRouter);

  // v2 API
  api.use("/api/v2", apiV2Router);

  app.use(api);
}
