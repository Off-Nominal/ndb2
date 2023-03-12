const ErrorCode = {
  SERVER_ERROR: 0,
  AUTHENTICATION_ERROR: 1,
  MALFORMED_BODY_DATA: 2,
};

export type APIResponse<T = null> = {
  success: boolean;
  errorCode?: keyof typeof ErrorCode;
  message: string | null;
  data: T;
};
