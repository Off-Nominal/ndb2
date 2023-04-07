import { APIResponse } from "../types/responses";

const responseUtils = {
  writeError: function (
    errorCode: APIResponse["errorCode"],
    message: string = "NA",
    data: any = null
  ): APIResponse {
    return {
      success: false,
      errorCode,
      message,
      data,
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
