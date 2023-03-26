import { isNumber } from "../helpers/typeguards";

const GM_BASELINE = process.env.GM_BASELINE;
const GM_EXTREMENESS = process.env.GM_EXTREMENESS;
const GM_PAYOUT_SIG_DIGITS = process.env.GM_PAYOUT_SIG_DIGITS;
const GM_MIN_DENOM = process.env.GM_MIN_DENOM;
const GM_PREDICTION_UPDATE_WINDOW_HOURS =
  process.env.GM_PREDICTION_UPDATE_WINDOW_HOURS;

// These are the explicit times that NDB2 will query for the next prediction that is due
// then trigger it.
const notificationSchedule = {
  offset: -5, // timezone offset from UTC to set the schedule with
  times: [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
  ],
};

// Mechanic validators check the data above and prevent deploy if invalid

if (!isNumber(GM_BASELINE)) {
  throw new TypeError("GM_BASELINE environment variable must be a number");
}

if (!isNumber(GM_EXTREMENESS)) {
  throw new TypeError("GM_EXTREMENESS environment variable must be a number");
}

if (!isNumber(GM_PAYOUT_SIG_DIGITS)) {
  throw new TypeError(
    "GM_PAYOUT_SIG_DIGITS environment variable must be a number"
  );
}

if (!isNumber(GM_MIN_DENOM)) {
  throw new TypeError("GM_MIN_DENOM environment variable must be a number");
}

if (!isNumber(GM_PREDICTION_UPDATE_WINDOW_HOURS)) {
  throw new TypeError(
    "GM_PREDICTION_UPDATE_WINDOW_HOURS environment variable must be a number"
  );
}

if (!isNumber(notificationSchedule.offset)) {
  throw new TypeError("Notification Schedule offset must be a number");
}

if (notificationSchedule.offset > 14 || notificationSchedule.offset < -12) {
  throw new RangeError("Notification offset must be between -12 and +14");
}

notificationSchedule.times.forEach((t) => {
  if (typeof t !== "string") {
    throw new TypeError("Notification schedule keys must be strings");
  }

  const isValid = t.match(/^(0?[0-9]|1[0-9]|2[0123])[:]([0-5][0-9])$/g);
  if (!isValid) {
    throw new Error(
      "Notification schedule keys must be in the format of HH:MM"
    );
  }
});

const GAME_MECHANICS = {
  baseline: Number(GM_BASELINE),
  extremeness: Number(GM_EXTREMENESS),
  payoutSigDigits: Number(GM_PAYOUT_SIG_DIGITS),
  minDenom: Number(GM_MIN_DENOM),
  predictionUpdateWindow: Number(GM_PREDICTION_UPDATE_WINDOW_HOURS),
  notificationSchedule,
};

export default GAME_MECHANICS;
