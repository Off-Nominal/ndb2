// Error Legend

// First digit - 9
// Digits 1 and 2 - Resource
// Digits 3 and 4 - Error Code

// Resources
// 00 - Generic
// 01 - Users
// 02 - Predictions
// 03 - Scores
// 04 - Seasons
// 05 - Bets
// 06 - Votes

export const Errors = {
  // Basic Errors
  SERVER_ERROR: 90000,
  MALFORMED_BODY_DATA: 90001,
  MALFORMED_QUERY_PARAMS: 90002,
  MALFORMED_URL_PARAMS: 90003,

  // 01 Users

  // 02 Predictions
  PREDICTION_NOT_FOUND: 90200,
  INVALID_PREDICTION_STATUS: 90201,
  INVALID_CHECK_DATE: 90202,

  // 03 Scores

  // 04 Seasons

  // 05 Bets
  BETS_NO_CHANGE: 90501,
  BETS_UNCHANGEABLE: 90502,

  // 06 Votes
} as const;

export type NDB2APIError = (typeof Errors)[keyof typeof Errors];
