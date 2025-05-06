import { Errors } from ".";

export type SuccessResponse<T> = {
  success: true;
  message: string | null;
  data: T;
};

export type ErrorResponse = {
  success: false;
  errorCode: Errors;
  message: string | null;
  data: null;
};

export type APIResponse<T> = SuccessResponse<T> | ErrorResponse;
