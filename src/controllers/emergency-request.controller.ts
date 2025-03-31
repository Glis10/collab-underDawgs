import { asyncHandler } from "@/utils/asyncHandler";
import { Request, Response } from "express";
import db from "@/db";
import ApiError from "@/utils/ApiError";
import { and, eq } from "drizzle-orm";
import { emergencyRequest, newEmergencyRequestSchema } from "@/db/schema";
import ApiResponse from "@/utils/ApiResponse";

const createEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { emergencyType, emergencyDescription, emergencyLocation } = req.body;
    const user = req.user;

    if (!user.id) {
      throw new ApiError(400, "User ID is required");
    }

    const parsedValues = newEmergencyRequestSchema.safeParse({
      userId: user.id,
      serviceType: emergencyType,
      description: emergencyDescription,
      location: emergencyLocation,
    });

    if (!parsedValues.success) {
      throw new ApiError(400, parsedValues.error.errors.join(","));
    }

    const newEmergencyRequest = await db
      .insert(emergencyRequest)
      .values(parsedValues.data)
      .returning({
        id: emergencyRequest.id,
        patientId: emergencyRequest.userId,
        emergencyType: emergencyRequest.serviceType,
        emergencyDescription: emergencyRequest.description,
        emergencyLocation: emergencyRequest.location,
        status: emergencyRequest.requestStatus,
      });

    if (!newEmergencyRequest) {
      throw new ApiError(500, "Error creating emergency request");
    }

    res
      .status(201)
      .json(
        new ApiResponse(201, "Emergency request created", newEmergencyRequest)
      );
  }
);

const getEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;

    if (!user.id) {
      throw new ApiError(400, "User ID is required");
    }

    const emergencyRequestData = await db.query.emergencyRequest.findFirst({
      where: and(
        eq(emergencyRequest.id, id),
        eq(emergencyRequest.userId, user.id)
      ),
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Emergency request found", emergencyRequestData)
      );
  }
);

const getUsersEmergencyRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInUser = req.user;

    if (!loggedInUser || !loggedInUser.id) {
      throw new ApiError(400, "User ID is required");
    }

    const emergencyRequests = await db.query.emergencyRequest.findMany({
      where: eq(emergencyRequest.userId, loggedInUser.id),
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Emergency requests found", emergencyRequests)
      );
  }
);

const updateEmergencyRequestStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      throw new ApiError(400, "Emergency request ID is required");
    }

    const existingEmergencyRequest = await db.query.emergencyRequest.findFirst({
      where: eq(emergencyRequest.id, id),
    });

    if (!existingEmergencyRequest) {
      throw new ApiError(404, "Emergency request not found");
    }

    const updatedEmergencyRequest = await db
      .update(emergencyRequest)
      .set({
        requestStatus: status,
      })
      .where(eq(emergencyRequest.id, id))
      .returning({
        id: emergencyRequest.id,
        patientId: emergencyRequest.userId,
        emergencyType: emergencyRequest.serviceType,
        emergencyDescription: emergencyRequest.description,
        emergencyLocation: emergencyRequest.location,
        status: emergencyRequest.requestStatus,
      });

    if (!updatedEmergencyRequest) {
      throw new ApiError(500, "Error updating emergency request");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Emergency request updated",
          updatedEmergencyRequest
        )
      );
  }
);

const deleteEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Emergency request ID is required");
    }

    const existingEmergencyRequest = await db.query.emergencyRequest.findFirst({
      where: eq(emergencyRequest.id, id),
    });

    if (!existingEmergencyRequest) {
      throw new ApiError(404, "Emergency request not found");
    }

    const deletedEmergencyRequest = await db
      .delete(emergencyRequest)
      .where(eq(emergencyRequest.id, id))
      .returning({
        id: emergencyRequest.id,
        patientId: emergencyRequest.userId,
        emergencyType: emergencyRequest.serviceType,
        emergencyDescription: emergencyRequest.description,
        emergencyLocation: emergencyRequest.location,
        status: emergencyRequest.requestStatus,
      });

    if (!deletedEmergencyRequest) {
      throw new ApiError(500, "Error deleting emergency request");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Emergency request deleted",
          deletedEmergencyRequest
        )
      );
  }
);

export {
  createEmergencyRequest,
  getEmergencyRequest,
  getUsersEmergencyRequests,
  updateEmergencyRequestStatus,
  deleteEmergencyRequest, 
}
