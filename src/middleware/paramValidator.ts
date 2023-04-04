import { NextFunction, Request, Response } from "express";
import {
  isBoolean,
  isIntegerParseableString,
  isNoMoreThan,
  isNumberParseableString,
  isString,
} from "../helpers/typeguards";
import responseUtils from "../utils/response";

const createChecker = (
  key: string,
  callback: (val: string) => boolean,
  error: string,
  statusCode: number,
  optional: boolean,
  type: "body" | "params" | "query"
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req[type][key];

    if (optional && value === undefined) {
      return next();
    }

    if (value === undefined || !callback(value)) {
      return res
        .status(statusCode)
        .json(
          responseUtils.writeError(
            "MALFORMED_BODY_DATA",
            `Body data property '${key}' ${error}`
          )
        );
    } else {
      next();
    }
  };
};

const paramValidator = {
  numberParseableString: (
    key: string,
    options?: { optional?: boolean; type?: "body" | "params" | "query" }
  ) => {
    return createChecker(
      key,
      isNumberParseableString,
      "must be string parseable as a number",
      400,
      options?.optional || false,
      options?.type || "body"
    );
  },
  string: (
    key: string,
    options?: { optional?: boolean; type?: "body" | "params" | "query" }
  ) => {
    return createChecker(
      key,
      isString,
      "must be a string",
      400,
      options?.optional || false,
      options?.type || "body"
    );
  },
  boolean: (
    key: string,
    options?: { optional?: boolean; type?: "body" | "params" | "query" }
  ) => {
    return createChecker(
      key,
      isBoolean,
      "must be parseable as a boolean",
      400,
      options?.optional || false,
      options?.type || "body"
    );
  },
  integerParseableString: (
    key: string,
    options?: { optional?: boolean; type?: "body" | "params" | "query" }
  ) => {
    return createChecker(
      key,
      isIntegerParseableString,
      "must be parseable as a safe integer",
      400,
      options?.optional || false,
      options?.type || "body"
    );
  },
  isPostgresInt: (
    key: string,
    options?: { optional?: boolean; type?: "body" | "params" | "query" }
  ) => {
    return createChecker(
      key,
      (val: string) => isNoMoreThan(Number(val), 2147483647),
      "can be no higher than at 2147483647.",
      400,
      options?.optional || false,
      options?.type || "body"
    );
  },
};

export default paramValidator;
