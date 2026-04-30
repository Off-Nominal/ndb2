import express from "express";
import { getAllSeasons } from "./routes/seasons/get";
import { getSeason } from "./routes/seasons/get_seasons_{id}";
import { getSeasonResults } from "./routes/seasons/get_seasons_{id}_results";
import { getSeasonResultForDiscordUser } from "./routes/seasons/get_seasons_{id}_users_discord_id_{discord_id}_result";
import { getUserAllTimeResult } from "./routes/users/get_discord_id_{discord_id}_results_all_time";
import { getUserSeasonResultsList } from "./routes/users/get_discord_id_{discord_id}_results";
import { getPredictionsSearch } from "./routes/predictions/get_predictions_search";
import { getPredictionById } from "./routes/predictions/get_predictions_{predictionId}";
import { untriggerPredictionById } from "./routes/predictions/delete_predictions_{predictionId}_trigger";
import { unjudgePredictionById } from "./routes/predictions/delete_predictions_{predictionId}_judgement";
import { retirePredictionById } from "./routes/predictions/patch_predictions_{predictionId}_retire";
import { createPrediction } from "./routes/predictions/post_predictions";
import { postPredictionBet } from "./routes/predictions/post_predictions_{predictionId}_bets";
import { postPredictionVote } from "./routes/predictions/post_predictions_{predictionId}_votes";
import { patchPredictionSnooze } from "./routes/predictions/patch_predictions_{predictionId}_snooze";
import { postPredictionSnoozeCheckVote } from "./routes/predictions/post_predictions_{predictionId}_snooze_checks_{snoozeCheckId}";
import { triggerPredictionById } from "./routes/predictions/post_predictions_{predictionId}_trigger";
import { mapRoutes } from "@shared/routerMap";
import { errorHandler } from "./middleware/errorHandler";
import "@domain/webhooks/config"; // Initialize webhook event listeners

export const apiV2Router = express.Router();

apiV2Router.use(
  "/seasons",
  mapRoutes([
    getAllSeasons,
    getSeasonResults,
    getSeasonResultForDiscordUser,
    getSeason,
  ]),
);
apiV2Router.use(
  "/users",
  mapRoutes([getUserAllTimeResult, getUserSeasonResultsList]),
);
apiV2Router.use(
  "/predictions",
  mapRoutes([
    createPrediction,
    postPredictionBet,
    postPredictionVote,
    postPredictionSnoozeCheckVote,
    patchPredictionSnooze,
    getPredictionsSearch,
    getPredictionById,
    triggerPredictionById,
    untriggerPredictionById,
    unjudgePredictionById,
    retirePredictionById,
  ]),
);

// Error handling middleware - must be last
apiV2Router.use(errorHandler);
