import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";

const app = express();

// Configuration
dotenv.config();
const PORT = process.env.PORT || 80;
const morganOutput = process.env.NODE_ENV === "dev" ? "dev" : "combined";
app.use(morgan(morganOutput));

// Routers
import usersRouter from "./routers/users";
app.use(usersRouter);

app.listen(PORT, () => {
  console.log(`NDB2 application listneing on port: `, PORT);
});
