import { isInteger } from "../helpers/typeguards";

const GM_PREDICTION_UPDATE_WINDOW_HOURS =
  process.env.GM_PREDICTION_UPDATE_WINDOW_HOURS;

if (!isInteger(GM_PREDICTION_UPDATE_WINDOW_HOURS)) {
  throw new TypeError(
    "GM_PREDICTION_UPDATE_WINDOW_HOURS environment variable must be a number"
  );
}

const GAME_MECHANICS = {
  predictionUpdateWindow: Number(GM_PREDICTION_UPDATE_WINDOW_HOURS),
};

export default GAME_MECHANICS;
