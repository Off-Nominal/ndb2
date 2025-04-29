import { NextFunction, Request, Response } from "express";
import { APIResponse, ErrorCode } from "../types/responses";

export const authenticateApplication = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authId = req.get("authorization");
  const validID = process.env.DISCORD_CLIENT_API_KEY;
  if (!authId || authId !== `Bearer ${validID}`) {
    const error: APIResponse<null> = {
      success: false,
      errorCode: ErrorCode.AUTHENTICATION_ERROR,
      message: "Unauthorized. Please ensure your API key is valid.",
      data: null,
    };
    return res.status(401).json(error);
  } else {
    return next();
  }
};
