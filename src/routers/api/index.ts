import express from "express";
const router = express.Router();

import predictionsRouter from "./predictions";
import usersRouter from "./users";
import scoresRouter from "./scores";
import seasonsRouter from "./seasons";

// Routers
router.use("/api/predictions", predictionsRouter);
router.use("/api/users", usersRouter);
router.use("/api/scores", scoresRouter);
router.use("/api/seasons", seasonsRouter);

export default router;
