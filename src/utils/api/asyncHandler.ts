import type { Request, Response, NextFunction } from "express";

export function asyncHandler(fnc: Function | any) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      await fnc(req, res, next);
    } catch (error: any) {
      console.log("Error caught in asyncHandler", error);

      res.status(error.statusCode || 500).json({
        message: error.message || "Internal server errror",
        success: false,
      });
    }
  };
}
