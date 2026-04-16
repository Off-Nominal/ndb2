import express from "express";
import { getAllSeasons } from "./routes/seasons/get";
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
import { mapRoutes } from "./utils/routerMap";
import { errorHandler } from "./middleware/errorHandler";
import "../../domain/webhooks/v2EventWebhooks"; // Initialize webhook event listeners

export const apiV2Router = express.Router();

apiV2Router.use("/seasons", mapRoutes([getAllSeasons]));
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
