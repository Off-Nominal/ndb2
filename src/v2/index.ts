import express from "express";
import seasonsRouter from "./routers/seasons";

export const apiV2Router = express.Router();

apiV2Router.use("/seasons", seasonsRouter());
