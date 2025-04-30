import type { V2 as API } from "@offnominal/ndb2-api-types/v2";

export default {
  writeError: function (
    errorCode: API.ErrorCode,
    message: string = "NA"
  ): API.ErrorResponse {
    return {
      success: false,
      errorCode,
      message,
      data: null,
    };
  },

  writeSuccess: function <T extends any>(
    data: any,
    message?: string
  ): API.SuccessResponse<T> {
    return {
      success: true,
      message: message || null,
      data,
    };
  },
};
