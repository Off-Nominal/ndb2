import { APIResponse } from "../types/responses";

export const authenticateApplication = (req, res, next) => {
  const authId = req.get("authorization");
  const validID = process.env.APP_AUTH_ID;
  if (!authId || authId !== `Bearer ${validID}`) {
    const error: APIResponse = {
      success: false,
      errorCode: "AUTHENTICATION_ERROR",
      message: "Unauthorized. Please ensure your API key is valid.",
      data: null,
    };
    res.json(error);
  } else {
    next();
  }
};
