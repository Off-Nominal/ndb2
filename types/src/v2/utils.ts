import { Errors, NDB2APIError } from "./errors";

export type SuccessResponse<T> = {
  success: true;
  message: string | null;
  data: T;
};

export type ErrorInfo = {
  code: NDB2APIError;
  message: string;
};

export type ErrorResponse = {
  success: false;
  errors: ErrorInfo[];
  data: null;
};

export type APIResponse<T> = SuccessResponse<T> | ErrorResponse;
