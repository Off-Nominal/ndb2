import express from "express";
const router = express.Router();

// Import route handlers
import get from "./get";
import get_seasons_season_id from "./get_seasons_{season_id}";

// Assign route handlers
router.use("/", get_seasons_season_id);
router.use("/", get);

export default router;
