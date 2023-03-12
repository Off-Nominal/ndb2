import { APIResponse } from "../types/responses";

const responseUtils = {
  writeError: function (
    errorCode: APIResponse["errorCode"],
    message?: string
  ): APIResponse {
    return {
      success: false,
      errorCode,
      message,
      data: null,
    };
  },

  writeSuccess: function (data: any, message?: string) {
    return {
      success: true,
      message,
      data,
    };
  },
};

export default responseUtils;
