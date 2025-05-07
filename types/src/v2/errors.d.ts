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

export enum NDB2APIError {
  // Generic
  SERVER_ERROR = 90000,
  AUTHENTICATION_ERROR = 90001,
  BAD_REQUEST = 90002,
  MALFORMED_BODY_DATA = 90003,
  MALFORMED_QUERY_PARAMS = 90004,
  NOT_FOUND = 90005,

  // Predictions
  INVALID_PREDICTION_STATUS = 90201,
  INVALID_CHECK_DATE = 90202,

  // Bets
  BETS_NO_CHANGE = 90501,
  BETS_UNCHANGEABLE = 90502,
}
