import { NextFunction, Request, Response } from "express";
import {
  isBoolean,
  isInteger,
  isIntegerParseableString,
  isNoMoreThan,
  isNumberParseableString,
  isString,
} from "../../helpers/typeguards";
import responseUtils_deprecated from "../../utils/response";
import { ErrorCode } from "../../types/responses";
import { WeakRequestHandler } from "express-zod-safe";

const createChecker = (
  key: string,
  callback: (val: string) => boolean,
  error: string,
  statusCode: number,
  optional: boolean,
  type: "body" | "params" | "query",
  allowArray: boolean
): WeakRequestHandler => {
  return (req, res, next) => {
    const value = (function () {
      if (type === "body") {
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
        return req.body[key as keyof typeof req.body];
      } else if (type === "params") {
        if (!req.params) {
          return res
            .status(statusCode)
            .json(
              responseUtils_deprecated.writeError(
                ErrorCode.MALFORMED_QUERY_PARAMS,
                `Query params are missing.`,
                null
              )
            );
        }

        return req.params[key as keyof typeof req.params];
      } else {
        return req.query[key as keyof typeof req.query];
      }
    })();

    if (!allowArray && Array.isArray(value)) {
      return res
        .status(statusCode)
        .json(
          responseUtils_deprecated.writeError(
            ErrorCode.MALFORMED_QUERY_PARAMS,
            `Query param property '${key}' cannot be an array.`,
            null
          )
        );
    }

    if (optional && value === undefined) {
      return next();
    }

    const values = Array.isArray(value) ? value : [value];

    for (const value of values) {
      if (value === undefined || !callback(value)) {
        return res
          .status(statusCode)
          .json(
            responseUtils_deprecated.writeError(
              ErrorCode.MALFORMED_BODY_DATA,
              `Body data property '${key}' ${error}`,
              null
            )
          );
      }
    }

    return next();
  };
};

type ParamValidatorOptions = {
  optional?: boolean;
  type?: "body" | "params" | "query";
  allowArray?: boolean;
};

const paramValidator = {
  integer: (key: string, options?: ParamValidatorOptions) => {
    return createChecker(
      key,
      isInteger,
      "must be an integer",
      400,
      options?.optional || false,
      options?.type || "body",
      options?.allowArray || false
    );
  },
  numberParseableString: (key: string, options?: ParamValidatorOptions) => {
    return createChecker(
      key,
      isNumberParseableString,
      "must be string parseable as a number",
      400,
      options?.optional || false,
      options?.type || "body",
      options?.allowArray || false
    );
  },
  string: (key: string, options?: ParamValidatorOptions) => {
    return createChecker(
      key,
      isString,
      "must be a string",
      400,
      options?.optional || false,
      options?.type || "body",
      options?.allowArray || false
    );
  },
  boolean: (key: string, options?: ParamValidatorOptions) => {
    return createChecker(
      key,
      isBoolean,
      "must be parseable as a boolean",
      400,
      options?.optional || false,
      options?.type || "body",
      options?.allowArray || false
    );
  },
  integerParseableString: (key: string, options?: ParamValidatorOptions) => {
    return createChecker(
      key,
      isIntegerParseableString,
      "must be parseable as a safe integer",
      400,
      options?.optional || false,
      options?.type || "body",
      options?.allowArray || false
    );
  },
  isPostgresInt: (key: string, options?: ParamValidatorOptions) => {
    return createChecker(
      key,
      (val: string) => isNoMoreThan(Number(val), 2147483647),
      "can be no higher than at 2147483647.",
      400,
      options?.optional || false,
      options?.type || "body",
      options?.allowArray || false
    );
  },
  isSeasonIdentifier: (key: string, options?: ParamValidatorOptions) => {
    return createChecker(
      key,
      (val: string) =>
        val === "current" ||
        val === "last" ||
        (isIntegerParseableString(val) &&
          isNoMoreThan(Number(val), 2147483647)),
      "must be one of the following: current, last, or a string parseable as a number",
      400,
      options?.optional || false,
      options?.type || "body",
      options?.allowArray || false
    );
  },
};

export default paramValidator;
