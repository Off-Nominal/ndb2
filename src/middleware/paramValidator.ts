import { NextFunction, Request, Response } from "express";
import {
  isBoolean,
  isIntegerParseableString,
  isNoMoreThan,
  isNumberParseableString,
  isString,
} from "../helpers/typeguards";
import responseUtils from "../utils/response";
import { ErrorCode } from "../types/responses";

const createChecker = (
  key: string,
  callback: (val: string) => boolean,
  error: string,
  statusCode: number,
  optional: boolean,
  type: "body" | "params" | "query",
  allowArray: boolean
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req[type][key];

    if (!allowArray && Array.isArray(value)) {
      return res
        .status(statusCode)
        .json(
          responseUtils.writeError(
            ErrorCode.MALFORMED_QUERY_PARAMS,
            `Query param property '${key}' cannot be an array.`
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
            responseUtils.writeError(
              ErrorCode.MALFORMED_BODY_DATA,
              `Body data property '${key}' ${error}`
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
