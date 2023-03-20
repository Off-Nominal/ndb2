import { isFuture, isValid } from "date-fns";
import { NextFunction, Request, Response } from "express";
import responseUtils from "../utils/response";

const createChecker = (
  key: string,
  callback: (val: Date | number) => boolean,
  error: string,
  statusCode: number
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.body[key];

    if (!callback(new Date(value))) {
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

const dateValidator = {
  isValid: (key: string) => {
    return createChecker(key, isValid, "must be parseable as a Date.", 400);
  },
  isFuture: (key: string) => {
    return createChecker(key, isFuture, "must be a Date in the future.", 400);
  },
};

export default dateValidator;
