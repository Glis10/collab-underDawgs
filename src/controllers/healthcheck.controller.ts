import ApiResponse from "@/utils/api/ApiResponse";
import { asyncHandler } from "@/utils/api/asyncHandler";
import type { Request, Response } from "express";

const healthCheck = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, "Server is up and running", {}));
});

export { healthCheck };
