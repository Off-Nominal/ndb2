import { APIResponse, ErrorCode } from "../types/responses";
import { WeakRequestHandler } from "express-zod-safe";

export const authenticateApplication: WeakRequestHandler = (req, res, next) => {
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
