export enum ErrorCode {
  SERVER_ERROR = 0,
  AUTHENTICATION_ERROR = 1,
  BAD_REQUEST = 2,
  MALFORMED_BODY_DATA = 3,
  MALFORMED_QUERY_PARAMS = 4,
}

export type APIResponse<T = null> = {
  success: boolean;
  errorCode?: ErrorCode;
  message: string | null;
  data: T;
};
