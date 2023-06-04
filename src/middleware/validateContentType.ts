import { NextFunction, Request, Response } from "express";
import responseUtils from "../utils/response";
import { ErrorCode } from "../types/responses";

export const validateContentType = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.headers["content-type"] !== "application/json") {
    return res
      .status(400)
      .json(
        responseUtils.writeError(
          ErrorCode.MALFORMED_BODY_DATA,
          `Content-Type header must be 'application/json'.`
        )
      );
  }
  next();
};
