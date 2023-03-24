import express, { Request, Response } from "express";
import { getPrediction } from "../../middleware/getPrediction";
import responseUtils from "../../utils/response";
const router = express.Router();

router.get(
  "/:prediction_id",
  getPrediction,
  async (req: Request, res: Response) => {
    res.json(
      responseUtils.writeSuccess(
        req.prediction,
        "Prediction fetched successfully."
      )
    );
  }
);

export default router;
