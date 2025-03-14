import ApiError from "@/utils/ApiError";
import { asyncHandler } from "@/utils/asyncHandler";
import { verifyJWT } from "@/utils/jwtTokens";
import type { NextFunction, Request, Response } from "express";

export const validateUser = asyncHandler(function validateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token =
    req.cookies.token || req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized");
  }

  const decoded = verifyJWT(token);

  req.user = decoded;
  next();
});
