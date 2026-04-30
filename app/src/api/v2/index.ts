import express from "express";
import { getAllSeasons } from "./routes/seasons/get";
import { getSeason } from "./routes/seasons/get_seasons_{id}";
import { getResultsAllTime } from "./routes/results/get_results_all_time";
import { getResultsSeasonsBySeasonId } from "./routes/results/get_results_seasons_{seasonId}";
import { getResultsSeasonUserResult } from "./routes/results/get_results_seasons_{seasonId}_users_discord_id_{discord_id}";
import { getResultsUserSeasonsList } from "./routes/results/get_results_users_discord_id_{discord_id}_seasons";
import { getResultsUserAllTime } from "./routes/results/get_results_users_discord_id_{discord_id}_all_time";
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
  mapRoutes([getAllSeasons, getSeason]),
);
apiV2Router.use(
  "/results",
  mapRoutes([
    getResultsAllTime,
    getResultsSeasonUserResult,
    getResultsSeasonsBySeasonId,
    getResultsUserAllTime,
    getResultsUserSeasonsList,
  ]),
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
