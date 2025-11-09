import responseUtils_deprecated from "../utils/response";
import { ErrorCode } from "../types/responses";
import { RequestHandler } from "express";

export const validateContentType: RequestHandler = (req, res, next) => {
  if (
    req.method === "POST" &&
    req.headers["content-type"] !== "application/json"
  ) {
    return res
      .status(400)
      .json(
        responseUtils_deprecated.writeError(
          ErrorCode.MALFORMED_BODY_DATA,
          `Content-Type header must be 'application/json'.`,
          null
        )
      );
  }
  next();
};
