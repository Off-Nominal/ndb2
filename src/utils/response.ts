import { APIResponse, ErrorCode } from "../types/responses";

const responseUtils = {
  writeError: function <T extends any>(
    errorCode: ErrorCode,
    message: string = "NA",
    data: T = null
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
      message,
      data,
    };
  },
};

export default responseUtils;
