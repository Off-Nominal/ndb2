import { isDate } from "date-fns";
import express from "express";
import { isNumber, isString } from "../helpers/typeguards";
import predictions from "../queries/predictions";
import users from "../queries/users";
import responseUtils from "../utils/response";

const router = express.Router();

router.post("/", async (req, res) => {
  const { discord_id, text, due_date } = req.body;

  // Body parameter validation
  if (!isNumber(discord_id)) {
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

  // Fetch User
  let userId: string;

  try {
    const user = await users.getOrAddByDiscordId(discord_id);
    userId = user.id;
  } catch (err) {
    console.error(err);
    return res.json(
      responseUtils.writeError("SERVER_ERROR", "Error Adding user")
    );
  }

  // Add prediction
  predictions
    .add(userId, text, new Date(due_date))
    .then((prediction) => {
      res.json(
        responseUtils.writeSuccess(
          prediction,
          "Prediction created successfully."
        )
      );
    })
    .catch((err) => {
      console.error(err);
      res.json(
        responseUtils.writeError("SERVER_ERROR", "Error Adding prediction")
      );
    });
});

export default router;
