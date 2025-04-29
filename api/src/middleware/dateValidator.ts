import { isFuture, isPast, isValid } from "date-fns";
import { NextFunction, Request, Response } from "express";
import responseUtils from "../utils/response";
import { ErrorCode } from "../types/responses";

const createChecker = (
  key: string,
  callback: (val: Date | number) => boolean,
  error: string,
  statusCode: number,
  optional: boolean
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.body[key];

    if (optional && (value === undefined || value === "")) {
      return next();
    }

    if (!value || !callback(new Date(value))) {
      return res
        .status(statusCode)
        .json(
          responseUtils.writeError(
            ErrorCode.MALFORMED_BODY_DATA,
            `Body data property '${key}' ${error}`
          )
        );
    } else {
      next();
    }
  };
};

const dateValidator = {
  isValid: (key: string, options?: { optional: boolean }) => {
    return createChecker(
      key,
      isValid,
      "must be parseable as a Date.",
      400,
      options?.optional || false
    );
  },
  isFuture: (key: string, options?: { optional: boolean }) => {
    return createChecker(
      key,
      isFuture,
      "must be a Date in the future.",
      400,
      options?.optional || false
    );
  },
  isPast: (key: string, options?: { optional: boolean }) => {
    return createChecker(
      key,
      isPast,
      "must be a Date in the past.",
      400,
      options?.optional || false
    );
  },
};

export default dateValidator;
