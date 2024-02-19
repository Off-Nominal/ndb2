import express from "express";
import { validateContentType } from "../../middleware/validateContentType";
import { authenticateApplication } from "../../middleware/authenticateApplication";
const apiRouter = express.Router();

// Middlewares
apiRouter.use(validateContentType);
apiRouter.use(authenticateApplication);
apiRouter.use(express.json());

// Import Predictions route handlers
import get_id from "./predictions/get_{id}";
import get_search from "./predictions/get_search";
import post from "./predictions/post";
import patch_id_retire from "./predictions/patch_{id}_retire";
import post_id_trigger from "./predictions/post_{id}_trigger";
import post_id_votes from "./predictions/post_{id}_votes";
import post_id_bets from "./predictions/post_{id}_bets";

// Assign route handlers
apiRouter.use("/predictions", get_search);
apiRouter.use("/predictions", get_id);
apiRouter.use("/predictions", post);
apiRouter.use("/predictions", patch_id_retire);
apiRouter.use("/predictions", post_id_trigger);
apiRouter.use("/predictions", post_id_votes);
apiRouter.use("/predictions", post_id_bets);

// Import Scores route handlers
import get from "./scores/get";
import get_seasons_season_id from "./scores/get_seasons_{season_id}";

// Assign route handlers
apiRouter.use("/scores", get_seasons_season_id);
apiRouter.use("/scores", get);

// Import Season route handlers
import getSeasons from "./seasons/get";

// Assign route handlers
apiRouter.use("/seasons", getSeasons);

// Import Users route handlers
import get_discord_id_id_scores from "./users/get_discord_id_{id}_scores";
import get_discord_id_id_scores_seasons_season_id from "./users/get_discord_id_{id}_scores_seasons_{season_id}";
import get_discord_id_id_bets from "./users/get_discord_id_{id}_bets";

// Assign route handlers
apiRouter.use("/discord_id", get_discord_id_id_scores_seasons_season_id);
apiRouter.use("/discord_id", get_discord_id_id_scores);
apiRouter.use("/discord_id", get_discord_id_id_bets);

export default apiRouter;
