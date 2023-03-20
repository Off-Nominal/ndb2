import express, { Request, Response } from "express";
import bodyValidator from "../../middleware/bodyValidator";
import { getPrediction } from "../../middleware/getPrediction";
import { PredictionLifeCycle } from "../../types/predicitions";
import responseUtils from "../../utils/response";
const router = express.Router();

router.post(
  "/:prediction_id/trigger",
  [bodyValidator.numberParseableString("discord_id"), getPrediction],
  (req: Request, res): Response => {
    const { discord_id } = req.body;

    // Verify prediction is open
    if (req.prediction.status !== PredictionLifeCycle.OPEN) {
      return res
        .status(400)
        .json(
          responseUtils.writeError(
            "BAD_REQUEST",
            "This prediction is not in an open state and cannot be retired."
          )
        );
    }

    res.json("thanks");
  }
);

export default router;
