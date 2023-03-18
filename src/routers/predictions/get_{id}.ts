import express from "express";
import { isNumberParseableString } from "../../helpers/typeguards";
import predictions from "../../queries/predictions";
import responseUtils from "../../utils/response";
const router = express.Router();

router.get("/:prediction_id", async (req, res) => {
  const { prediction_id } = req.params;

  // Body parameter validation
  if (!isNumberParseableString(prediction_id)) {
    return res
      .status(400)
      .json(
        responseUtils.writeError(
          "MALFORMED_BODY_DATA",
          "Predictions Ids must be a parseable as number"
        )
      );
  }

  // Fetch prediction
  predictions
    .getByPredictionId(prediction_id)
    .then((ep) => {
      if (!ep) {
        return res
          .status(404)
          .json(
            responseUtils.writeError(
              "BAD_REQUEST",
              `Predicton with id ${prediction_id} does not exist.`
            )
          );
      }
      res.json(
        responseUtils.writeSuccess(ep, "Prediction fetched successfully.")
      );
    })
    .catch((err) => {
      console.error(err);
      res
        .status(500)
        .json(
          responseUtils.writeError(
            "SERVER_ERROR",
            "Unable to fetch prediction."
          )
        );
    });
});

export default router;
