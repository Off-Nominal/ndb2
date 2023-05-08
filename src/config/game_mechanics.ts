import { isInteger, isNumber } from "../helpers/typeguards";

const GM_BASELINE = process.env.GM_BASELINE;
const GM_EXTREMENESS = process.env.GM_EXTREMENESS;
const GM_PAYOUT_SIG_DIGITS = process.env.GM_PAYOUT_SIG_DIGITS;
const GM_MIN_DENOM = process.env.GM_MIN_DENOM;
const GM_PREDICTION_UPDATE_WINDOW_HOURS =
  process.env.GM_PREDICTION_UPDATE_WINDOW_HOURS;

// Mechanic validators check the data above and prevent deploy if invalid
if (!isNumber(GM_BASELINE)) {
  throw new TypeError("GM_BASELINE environment variable must be a number");
}

if (!isNumber(GM_EXTREMENESS)) {
  throw new TypeError("GM_EXTREMENESS environment variable must be a number");
}

if (!isInteger(GM_PAYOUT_SIG_DIGITS)) {
  throw new TypeError(
    "GM_PAYOUT_SIG_DIGITS environment variable must be a number"
  );
}

if (!isNumber(GM_MIN_DENOM)) {
  throw new TypeError("GM_MIN_DENOM environment variable must be a number");
}

if (!isInteger(GM_PREDICTION_UPDATE_WINDOW_HOURS)) {
  throw new TypeError(
    "GM_PREDICTION_UPDATE_WINDOW_HOURS environment variable must be a number"
  );
}

const GAME_MECHANICS = {
  baseline: Number(GM_BASELINE),
  extremeness: Number(GM_EXTREMENESS),
  payoutSigDigits: Number(GM_PAYOUT_SIG_DIGITS),
  minDenom: Number(GM_MIN_DENOM),
  predictionUpdateWindow: Number(GM_PREDICTION_UPDATE_WINDOW_HOURS),
};

export default GAME_MECHANICS;
