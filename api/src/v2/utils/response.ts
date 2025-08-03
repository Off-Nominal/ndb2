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
   * Handle Zod validation errors and convert them to error response format
   * Supports validation errors for params, query, and body
   *
   * @param errors - Array of Zod validation errors
   * @returns Array of ErrorInfo objects (empty array if no validation errors found)
   *
   * @example
   * // For a route with params, query, and body validation:
   * const validator = validate({
   *   handler: (errors, req, res, next) => {
   *     const errorInfos = responseUtils.handleValidationErrors(errors);
   *     if (errorInfos.length > 0) {
   *       res.status(400).json(responseUtils.writeErrors(errorInfos));
   *     } else {
   *       res.status(500).json(responseUtils.writeErrors([{
   *         code: API.Errors.SERVER_ERROR,
   *         message: "There was an error processing your request."
   *       }]));
   *     }
   *   },
   *   params: z.object({ id: z.string() }),        // Uses MALFORMED_URL_PARAMS (90006)
   *   query: z.object({ limit: z.number().optional() }), // Uses MALFORMED_QUERY_PARAMS (90004)
   *   body: z.object({ name: z.string(), email: z.string().email() }) // Uses MALFORMED_BODY_DATA (90003)
   * });
   */
  handleValidationErrors: function (errors: any[]): API.Utils.ErrorInfo[] {
    const errorInfos: API.Utils.ErrorInfo[] = [];

    // Process all validation errors
    errors.forEach((err) => {
      switch (err.type) {
        case "params":
          // URL parameter validation errors
          err.errors.issues.forEach((issue: any) => {
            errorInfos.push({
              code: API.Errors.MALFORMED_URL_PARAMS,
              message: issue.message,
            });
          });
          break;

        case "query":
          // Query string validation errors
          err.errors.issues.forEach((issue: any) => {
            errorInfos.push({
              code: API.Errors.MALFORMED_QUERY_PARAMS,
              message: issue.message,
            });
          });
          break;

        case "body":
          // Request body validation errors
          err.errors.issues.forEach((issue: any) => {
            errorInfos.push({
              code: API.Errors.MALFORMED_BODY_DATA,
              message: issue.message,
            });
          });
          break;

        default:
          // For any other error types, skip them (let route handle fallback)
          break;
      }
    });

    return errorInfos;
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
