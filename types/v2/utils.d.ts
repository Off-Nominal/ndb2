import { NDB2APIErrorCode } from "./errors";

export type SuccessResponse<T> = {
  success: true;
  message: string | null;
  data: T;
};

export type ErrorResponse = {
  success: false;
  errorCode: NDB2APIErrorCode;
  message: string | null;
  data: null;
};

export type APIResponse<T> = SuccessResponse<T> | ErrorResponse;
