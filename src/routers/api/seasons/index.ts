import express from "express";
const router = express.Router();

// Import route handlers
import get from "./get";

// Assign route handlers
router.use("/", get);

export default router;
