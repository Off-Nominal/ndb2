import path from "node:path";
import express, { type Express } from "express";
import { webRouter } from "./routes/index";

/** Resolves to `src/web` under Vitest; `dist/web` when running compiled `dist/index.js`. */
const webRoot = __dirname;

export function mountWeb(app: Express): void {
  app.set("view engine", "ejs");
  app.set("views", path.join(webRoot, "views"));

  app.use("/assets", express.static(path.join(webRoot, "public")));

  app.use(webRouter);
}
