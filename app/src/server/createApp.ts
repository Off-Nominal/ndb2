import express, { type Express } from "express";
import { isDev } from "@shared/utils";
import { mountJsonApi } from "../api/mountJsonApi";
import { mountWeb } from "../web/mountWeb";

export function createApp(): Express {
  const app = express();

  if (isDev()) {
    void (async () => {
      const morgan = (await import("morgan")).default;
      app.use(morgan("dev"));
    })();
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.get("/health", (req, res) => {
    return res.status(200).json({ status: "healthy" });
  });

  mountWeb(app);
  /** JSON API is under `/api` only so `/assets/*` and HTML never run API auth middleware. */
  mountJsonApi(app);

  app.get("*", (req, res) => {
    return res.status(404).json({ error: "Not found" });
  });

  return app;
}
