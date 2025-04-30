import express, { Request, Response } from "express";
import webhookManager from "../../config/webhook_subscribers";
import { getDbClient } from "../../middleware/getDbClient";
import { getPrediction } from "../../middleware/getPrediction";
import paramValidator from "../../middleware/paramValidator";
import predictionStatusValidator from "../../middleware/predictionStatusValidator";
import predictions from "../../db/queries/predictions";
import { PredictionLifeCycle } from "../../types/predicitions";
import responseUtils_deprecated from "../../utils/response";
import { ErrorCode } from "../../types/responses";

const router = express.Router();

router.delete(
  "/:prediction_id/trigger",
  [
    paramValidator.integerParseableString("prediction_id", { type: "params" }),
    paramValidator.isPostgresInt("prediction_id", { type: "params" }),
    getDbClient,
    getPrediction,
    predictionStatusValidator([PredictionLifeCycle.CLOSED]),
  ],
  async (req: Request, res: Response) => {
    return predictions
      .undoClosePredictionById(req.dbClient)(req.prediction.id)
      .then(() =>
        predictions.getPredictionById(req.dbClient)(req.prediction.id)
      )
      .then((prediction) => {
        // Notify Subscribers
        webhookManager.emit("untriggered_prediction", prediction);

        return res.json(
          responseUtils_deprecated.writeSuccess(
            prediction,
            "Prediction untriggered successfully."
          )
        );
      })
      .catch((err) => {
        console.error(err);
        return res
          .status(500)
          .json(
            responseUtils_deprecated.writeError(
              ErrorCode.SERVER_ERROR,
              "There was an error untriggering this prediction."
            )
          );
      });
  }
);

export default router;
