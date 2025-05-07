import { isFuture, isPast, isValid } from "date-fns";
import responseUtils_deprecated from "../utils/response";
import { ErrorCode } from "../types/responses";
import { WeakRequestHandler } from "express-zod-safe";

const createChecker = (
  key: string,
  callback: (val: Date | number) => boolean,
  error: string,
  statusCode: number,
  optional: boolean
): WeakRequestHandler => {
  return (req, res, next) => {
    if (!req.body) {
      return res
        .status(statusCode)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.MALFORMED_BODY_DATA,
            `Body data is missing.`,
            null
          )
        );
    }

    if (typeof req.body !== "object") {
      return res
        .status(statusCode)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.MALFORMED_BODY_DATA,
            `Body data is not an object.`,
            null
          )
        );
    }
    const value = req.body[key as keyof typeof req.body];

    if (optional && (value === undefined || value === "")) {
      return next();
    }

    if (!value || !callback(new Date(value))) {
      return res
        .status(statusCode)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.MALFORMED_BODY_DATA,
            `Body data property '${key}' ${error}`,
            null
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
