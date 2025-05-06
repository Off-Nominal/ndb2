import API from "@offnominal/ndb2-api-types";

export default {
  writeError: function (
    errorCode: API.Errors,
    message: string = "NA"
  ): API.Utils.ErrorResponse {
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
  ): API.Utils.SuccessResponse<T> {
    return {
      success: true,
      message: message || null,
      data,
    };
  },
};
