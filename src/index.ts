import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { authenticateApplication } from "./middleware/authenticateApplication";

const app = express();

// Configuration
dotenv.config();
const PORT = process.env.PORT || 80;
if (process.env.NODE_ENV === "dev") {
  app.use(morgan("dev"));
}
app.use(express.json());

// Authentication
app.use(authenticateApplication);

// Routers
import predictionsRouter from "./routers/predictions";
app.use("/api/predictions", predictionsRouter);

import betsRouter from "./routers/bets";
app.use("/api/bets", betsRouter);

app.listen(PORT, () => {
  console.log(`NDB2 application listneing on port: `, PORT);
});
