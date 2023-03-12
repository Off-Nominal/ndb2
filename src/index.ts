import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { authenticateApplication } from "./middleware/authenticateApplication";

const app = express();

// Configuration
dotenv.config();
const PORT = process.env.PORT || 80;
const morganOutput = process.env.NODE_ENV === "dev" ? "dev" : "combined";
app.use(morgan(morganOutput));
app.use(express.urlencoded());

// Authentication
app.use(authenticateApplication);

// Routers
import usersRouter from "./routers/users";
import predictionsRouter from "./routers/predictions";
app.use("/api/users", usersRouter);
app.use("/api/predictions", predictionsRouter);

app.listen(PORT, () => {
  console.log(`NDB2 application listneing on port: `, PORT);
});
