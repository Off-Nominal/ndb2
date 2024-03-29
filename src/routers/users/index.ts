import express from "express";
const router = express.Router();

// Import route handlers
import get_discord_id_id_scores from "./get_discord_id_{id}_scores";
import get_discord_id_id_scores_seasons_season_id from "./get_discord_id_{id}_scores_seasons_{season_id}";
import get_discord_id_id_bets from "./get_discord_id_{id}_bets";

// Assign route handlers
router.use("/discord_id", get_discord_id_id_scores_seasons_season_id);
router.use("/discord_id", get_discord_id_id_scores);
router.use("/discord_id", get_discord_id_id_bets);

export default router;
