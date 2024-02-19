import express from "express";
import PredictionMonitor from "./classes/PredictionMonitor";
import apiRouter from "./routers/api";
import pagesRouter from "./routers/pages";
import path from "node:path";
import authRouter from "./routers/api/auth";
import cookieParser from "cookie-parser";
import { discordMemberManager } from "./classes/DiscordMemberManager";

const app = express();

// Configuration
app.use(cookieParser());
const PORT = process.env.PORT || 80;
if (process.env.NODE_ENV === "dev") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
}

app.use(express.static(path.join(__dirname, "../public")));

// Routers
app.use("/api/auth", authRouter);
app.use("/api", apiRouter);
app.get("/api/*", (req, res) => {
  return res.status(404).json({ error: "Not found" });
});

app.use("/", pagesRouter);
app.get("*", (req, res) => {
  res.redirect("/error/404");
});

app.listen(PORT, () => {
  console.log(`[NDB2]: Application listening on port:`, PORT);
});

const monitor = new PredictionMonitor();

discordMemberManager.initialize();
