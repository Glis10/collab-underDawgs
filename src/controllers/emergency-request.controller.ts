import { asyncHandler } from "@/utils/api/asyncHandler";
import { Request, Response } from "express";
import db from "@/db";
import ApiError from "@/utils/api/ApiError";
import { and, eq } from "drizzle-orm";
import { emergencyRequest, newEmergencyRequestSchema } from "@/db/schema";
import ApiResponse from "@/utils/api/ApiResponse";
import { getBestServiceProvider } from "@/utils/maps";

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
        userId: emergencyRequest.userId,
        emergencyType: emergencyRequest.serviceType,
        emergencyDescription: emergencyRequest.description,
        emergencyLocation: emergencyRequest.location,
        status: emergencyRequest.requestStatus,
        currentLocation: emergencyRequest.location,
      });

    if (!newEmergencyRequest) {
      throw new ApiError(500, "Error creating emergency request");
    }

    if (!emergencyLocation) {
      throw new ApiError(400, "Emergency location is required");
    }

    if (!emergencyLocation.latitude || !emergencyLocation.longitude) {
      throw new ApiError(400, "Emergency location coordinates are required");
    }

    if (
      isNaN(parseFloat(emergencyLocation.latitude)) ||
      isNaN(parseFloat(emergencyLocation.longitude))
    ) {
      throw new ApiError(400, "Invalid emergency location coordinates");
    }

    const emergencyRequestLocation = {
      latitude: parseFloat(emergencyLocation.latitude),
      longitude: parseFloat(emergencyLocation.longitude),
    };

    const bestServiceProvider = await getBestServiceProvider(
      emergencyRequestLocation
    );

    if (!bestServiceProvider || !bestServiceProvider.id) {
      const emergencyRequestId = newEmergencyRequest[0].id;
      await db
        .delete(emergencyRequest)
        .where(eq(emergencyRequest.id, emergencyRequestId));
      throw new ApiError(404, "No available service provider found");
    }

    const serviceProviderId = bestServiceProvider.id;

    res.status(201).json(
      new ApiResponse(201, "Emergency request created", {
        emergencyRequest: newEmergencyRequest,
        serviceProviderId,
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
      throw new ApiError(400, "Emergency request ID is required");
    }

    const updateData = req.body;

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, "No data to update");
    }

    const invalidKeys = Object.keys(updateData).filter(
      (key) => !Object.keys(emergencyRequest).includes(key)
    );

    if (invalidKeys.length > 0) {
      throw new ApiError(
        400,
        `Invalid data to update. Invalid keys: ${invalidKeys}`
      );
    }

    const existingEmergencyRequest = await db.query.emergencyRequest.findFirst({
      where: eq(emergencyRequest.id, id),
    });

    if (!existingEmergencyRequest) {
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
      throw new ApiError(400, "User ID is required");
    }

    if (!loggedInUser.role) {
      throw new ApiError(400, "User role is required");
    }

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
  updateEmergencyRequest,
  deleteEmergencyRequest,
};
