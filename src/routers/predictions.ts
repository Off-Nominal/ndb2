import express from "express";
import { isDate, isFuture } from "date-fns";
import { isNumberParseableString, isString } from "../helpers/typeguards";
import bets from "../queries/bets";
import predictions from "../queries/predictions";
import users from "../queries/users";
import responseUtils from "../utils/response";
const router = express.Router();

router.post("/", async (req, res) => {
  const { discord_id, text, due_date } = req.body;

  // Body parameter validation
  if (!isNumberParseableString(discord_id)) {
    return res
      .status(400)
      .json(
        responseUtils.writeError(
          "MALFORMED_BODY_DATA",
          "Discord Ids must be a parseable as number"
        )
      );
  }

  if (!isString(text)) {
    return res
      .status(400)
      .json(
        responseUtils.writeError(
          "MALFORMED_BODY_DATA",
          "Prediction text must be a parseable as string"
        )
      );
  }

  if (!isDate(new Date(due_date))) {
    return res
      .status(400)
      .json(
        responseUtils.writeError(
          "MALFORMED_BODY_DATA",
          "Prediction due_date must be a parseable as a Date"
        )
      );
  }

  if (!isFuture(new Date(due_date))) {
    return res
      .status(400)
      .json(
        responseUtils.writeError(
          "MALFORMED_BODY_DATA",
          "Prediction due_date must be in the future"
        )
      );
  }

  // Fetch User
  let userId: string;

  try {
    const user = await users.getOrAddByDiscordId(discord_id);
    userId = user.id;
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json(responseUtils.writeError("SERVER_ERROR", "Error Adding user"));
  }

  // Add prediction
  const created_date = new Date();

  predictions
    .add(userId, text, new Date(due_date), created_date)
    .then((p) => bets.add(userId, p.id, true, created_date))
    .then((b) => predictions.getByPredictionId(b.prediction_id))
    .then((ep) => {
      res.json(
        responseUtils.writeSuccess(ep, "Prediction created successfully.")
      );
    })
    .catch((err) => {
      console.error(err);
      res
        .status(500)
        .json(
          responseUtils.writeError("SERVER_ERROR", "Error Adding prediction")
        );
    });
});

export default router;
