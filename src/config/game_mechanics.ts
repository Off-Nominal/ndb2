import { isNumber } from "../helpers/typeguards";

const GM_BASELINE = process.env.GM_BASELINE;
const GM_EXTREMENESS = process.env.GM_EXTREMENESS;
const GM_PAYOUT_SIG_DIGITS = process.env.GM_PAYOUT_SIG_DIGITS;
const GM_MIN_DENOM = process.env.GM_MIN_DENOM;
const GM_PREDICTION_UPDATE_WINDOW_HOURS =
  process.env.GM_PREDICTION_UPDATE_WINDOW_HOURS;

if (!isNumber(GM_BASELINE)) {
  throw new Error("GM_BASELINE environment variable must be a number");
}

if (!isNumber(GM_EXTREMENESS)) {
  throw new Error("GM_EXTREMENESS environment variable must be a number");
}

if (!isNumber(GM_PAYOUT_SIG_DIGITS)) {
  throw new Error("GM_PAYOUT_SIG_DIGITS environment variable must be a number");
}

if (!isNumber(GM_MIN_DENOM)) {
  throw new Error("GM_MIN_DENOM environment variable must be a number");
}

if (!isNumber(GM_PREDICTION_UPDATE_WINDOW_HOURS)) {
  throw new Error(
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
