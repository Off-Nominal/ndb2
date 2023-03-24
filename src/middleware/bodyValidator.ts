import { NextFunction, Request, Response } from "express";
import {
  isBoolean,
  isNumberParseableString,
  isString,
} from "../helpers/typeguards";
import responseUtils from "../utils/response";

const createChecker = (
  key: string,
  callback: (val: string) => boolean,
  error: string,
  statusCode: number,
  optional: boolean
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.body[key];

    if (optional && value === undefined) {
      return next();
    }

    if (!value || !callback(value)) {
      return res
        .status(statusCode)
        .json(
          responseUtils.writeError(
            "MALFORMED_BODY_DATA",
            `Body data property '${key}' ${error}`
          )
        );
    } else {
      value;
      next();
    }
  };
};

const bodyValidator = {
  numberParseableString: (key: string, options?: { optional: boolean }) => {
    return createChecker(
      key,
      isNumberParseableString,
      "must be parseable as a number",
      400,
      options?.optional || false
    );
  },
  string: (key: string, options?: { optional: boolean }) => {
    return createChecker(
      key,
      isString,
      "must be a string",
      400,
      options?.optional || false
    );
  },
  boolean: (key: string, options?: { optional: boolean }) => {
    return createChecker(
      key,
      isBoolean,
      "must be parseable as a boolean",
      400,
      options?.optional || false
    );
  },
};

export default bodyValidator;
