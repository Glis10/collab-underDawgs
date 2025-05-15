import { asyncHandler } from "@/utils/api/asyncHandler";
import { Request, Response } from "express";
import db from "@/db";
import ApiError from "@/utils/api/ApiError";
import { and, desc, eq } from "drizzle-orm";
import { emergencyRequest, newEmergencyRequestSchema, user } from "@/db/schema";
import ApiResponse from "@/utils/api/ApiResponse";

const createEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { emergencyType, emergencyDescription, userLocation } = req.body;
    const loggedInUser = req.user;

    if (!loggedInUser.id) {
      console.error("User ID is required");
      throw new ApiError(400, "User ID is required");
    }

    if (!userLocation) {
      console.error("user location required");
      throw new ApiError(400, "user location required");
    }

    if (!userLocation.latitude || !userLocation.longitude) {
      console.error("Emergency location coordinates are required");
      throw new ApiError(400, "Emergency location coordinates are required");
    }

    if (
      isNaN(parseFloat(userLocation.latitude)) ||
      isNaN(parseFloat(userLocation.longitude))
    ) {
      console.error("Invalid emergency location coordinates");
      throw new ApiError(400, "Invalid emergency location coordinates");
    }

    const updateUserLocation = await db
      .update(user)
      .set({
        currentLocation: userLocation,
      })
      .where(eq(user.id, loggedInUser.id));

    const parsedValues = newEmergencyRequestSchema.safeParse({
      userId: loggedInUser.id,
      serviceType: String(emergencyType).toLowerCase(),
      description: emergencyDescription,
      location: userLocation,
    });

    if (!parsedValues.success) {
      console.error("Parsing Error: ", parsedValues.error.errors);
      throw new ApiError(400, parsedValues.error.errors.join(","));
    }

    const newEmergencyRequest = await db
      .insert(emergencyRequest)
      .values(parsedValues.data)
      .returning({
        id: emergencyRequest.id,
        userId: emergencyRequest.userId,
        emergencyType: emergencyRequest.serviceType,
        emergencyDescription: emergencyRequest.description,
        emergencyLocation: emergencyRequest.location,
        status: emergencyRequest.requestStatus,
        currentLocation: emergencyRequest.location,
      });

    if (!newEmergencyRequest) {
      console.error("Error creating emergency request");
      throw new ApiError(500, "Error creating emergency request");
    }

    res.status(201).json(
      new ApiResponse(201, "Emergency request created", {
        emergencyRequest: newEmergencyRequest[0],
      })
    );
  }
);

const getEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const emergencyRequestData = await db.query.emergencyRequest.findFirst({
      where: and(eq(emergencyRequest.id, id)),
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
      console.error("User ID is required");
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

const updateEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      console.error("Emergency request ID is required");
      throw new ApiError(400, "Emergency request ID is required");
    }

    const updateData = req.body;

    if (Object.keys(updateData).length === 0) {
      console.error("No data to update");
      throw new ApiError(400, "No data to update");
    }

    const invalidKeys = Object.keys(updateData).filter(
      (key) => !Object.keys(emergencyRequest).includes(key)
    );

    if (invalidKeys.length > 0) {
      console.error(`Invalid data to update. Invalid keys: ${invalidKeys}`);
      throw new ApiError(
        400,
        `Invalid data to update. Invalid keys: ${invalidKeys}`
      );
    }

    const existingEmergencyRequest = await db.query.emergencyRequest.findFirst({
      where: eq(emergencyRequest.id, id),
    });

    if (!existingEmergencyRequest) {
      console.error("Emergency request not found");
      throw new ApiError(404, "Emergency request not found");
    }

    const updatedEmergencyRequest = await db
      .update(emergencyRequest)
      .set(updateData)
      .where(eq(emergencyRequest.id, id))
      .returning({
        id: emergencyRequest.id,
        userId: emergencyRequest.userId,
        emergencyType: emergencyRequest.serviceType,
        emergencyDescription: emergencyRequest.description,
        emergencyLocation: emergencyRequest.location,
        requestStatus: emergencyRequest.requestStatus,
      });

    if (!updatedEmergencyRequest) {
      console.error("Error updating emergency request");
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
    const loggedInUser = req.user;

    if (!loggedInUser || !loggedInUser.id) {
      console.error("User ID is required");
      throw new ApiError(400, "User ID is required");
    }

    if (!loggedInUser.role) {
      console.error("User role is required");
      throw new ApiError(400, "User role is required");
    }

    if (!id) {
      console.error("Emergency request ID is required");
      throw new ApiError(400, "Emergency request ID is required");
    }

    const existingEmergencyRequest = await db.query.emergencyRequest.findFirst({
      where: eq(emergencyRequest.id, id),
    });

    if (!existingEmergencyRequest) {
      console.error("Emergency request not found");
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
      console.error("Error deleting emergency request");
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

const getRecentEmergencyRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    console.log("userId", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const recentRequests = await db.query.emergencyRequest.findMany({
      where: eq(emergencyRequest.userId, userId),
      orderBy: [desc(emergencyRequest.requestTime)],
      limit: 10,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Recent emergency requests", recentRequests));
  }
);
export {
  createEmergencyRequest,
  getEmergencyRequest,
  getUsersEmergencyRequests,
  updateEmergencyRequest,
  deleteEmergencyRequest,
  getRecentEmergencyRequests,
};
