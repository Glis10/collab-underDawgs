import { TUser, TUserRole } from "@/db/schema";
import ApiError from "@/utils/ApiError";
import { asyncHandler } from "@/utils/asyncHandler";
import { verifyJWT } from "@/utils/jwtTokens";
import type { NextFunction, Request, Response } from "express";

const verifyAndDecodeToken = (token: string) => {
  if (!token) {
    throw new ApiError(401, "Unauthorized");
  }

  const decoded = verifyJWT(token) as Partial<TUser>;

  if (!decoded.id) {
    throw new ApiError(401, "Invalid token");
  }

  return decoded;
};

const validateServiceProvider = asyncHandler(
  async function validateServiceProvider(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const token =
      req.cookies.token || req.headers.authorization?.replace("Bearer ", "");

    const decoded = verifyAndDecodeToken(token);
    req.user = decoded;
    next();
  }
);

const validateRoleAuth = (allowedRoles: TUserRole[]) => {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const token =
        req.cookies.token || req.headers.authorization?.replace("Bearer ", "");

      const decoded = verifyAndDecodeToken(token);

      if (!allowedRoles.includes(decoded.role as TUserRole)) {
        throw new ApiError(401, "Not authorized to perform this action");
      }

      req.user = decoded;
      next();
    }
  );
};

export { validateServiceProvider, validateRoleAuth };
