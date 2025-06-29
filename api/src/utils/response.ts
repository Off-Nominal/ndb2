import { APIResponse, ErrorCode } from "../types/responses";

const responseUtils_deprecated = {
  writeError: function <T extends unknown>(
    errorCode: ErrorCode,
    message: string = "NA",
    data: T
  ): APIResponse<T> {
    return {
      success: false,
      errorCode,
      message,
      data,
    };
  },

  writeSuccess: function <T extends any>(
    data: any,
    message?: string
  ): APIResponse<T> {
    return {
      success: true,
      message: message || null,
      data,
    };
  },
};

export default responseUtils_deprecated;
