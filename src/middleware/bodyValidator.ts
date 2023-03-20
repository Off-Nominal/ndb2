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
  statusCode: number
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.body[key];

    if (!callback(value)) {
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

const bodyValidator = {
  numberParseableString: (key: string) => {
    return createChecker(
      key,
      isNumberParseableString,
      "must be parseable as a number",
      400
    );
  },
  string: (key: string) => {
    return createChecker(key, isString, "must be a string", 400);
  },
  boolean: (key: string) => {
    return createChecker(key, isBoolean, "must be parseable as a boolean", 400);
  },
};

export default bodyValidator;
