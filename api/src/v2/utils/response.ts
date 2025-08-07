import * as API from "@offnominal/ndb2-api-types/v2";

const responseUtils = {
  /**
   * Write an error response with one or more errors
   * @param errors - Array of error objects, each containing an error code and message
   * @returns ErrorResponse object
   */
  writeErrors: function (
    errors: API.Utils.ErrorInfo[]
  ): API.Utils.ErrorResponse {
    return {
      success: false,
      errors,
      data: null,
    };
  },
  /**
   * Write a success response
   * @param data - The data to return
   * @param message - Optional success message
   * @returns SuccessResponse object
   */
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

export default responseUtils;
