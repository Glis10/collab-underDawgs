import { asyncHandler } from "@/utils/api/asyncHandler";
import { Request, Response } from "express";
import db from "@/db";
import ApiError from "@/utils/api/ApiError";
import { and, eq } from "drizzle-orm";
import {
  emergencyRequest,
  emergencyResponse,
  serviceProvider,
} from "@/db/schema";
import ApiResponse from "@/utils/api/ApiResponse";
import { getOptimalRoute } from "@/utils/maps/galli-maps";

const createEmergencyResponse = asyncHandler(
  async (req: Request, res: Response) => {
    const { emergencyRequestId, serviceProviderId } = req.body;

    if (!emergencyRequestId || !serviceProviderId) {
      throw new ApiError(
        400,
        "Emergency ID and Service Provider ID are required"
      );
    }

    const existingEmergencyResponse =
      await db.query.emergencyResponse.findFirst({
        where: and(
          eq(emergencyRequestId, emergencyResponse.emergencyRequestId),
          eq(serviceProviderId, emergencyResponse.serviceProviderId)
        ),
      });

    if (existingEmergencyResponse) {
      throw new ApiError(400, "Emergency response already exists");
    }

    const assignedServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, serviceProviderId),
    });

    const emergencyRequestDetails = await db.query.emergencyRequest.findFirst({
      where: eq(emergencyRequest.id, emergencyRequestId),
    });

    if (!assignedServiceProvider || !emergencyRequestDetails) {
      throw new ApiError(
        404,
        "Service provider or emergency request not found"
      );
    }

    if (
      !assignedServiceProvider.currentLocation ||
      !emergencyRequestDetails.location
    ) {
      throw new ApiError(
        404,
        "Service provider or emergency request location not found"
      );
    }

    if (
      !assignedServiceProvider.currentLocation.latitude ||
      !assignedServiceProvider.currentLocation.longitude ||
      !emergencyRequestDetails.location.latitude ||
      !emergencyRequestDetails.location.longitude
    ) {
      throw new ApiError(
        404,
        "Service provider or emergency request location coordinates not found"
      );
    }

    const optimalPath = await getOptimalRoute({
      srcLat: assignedServiceProvider.currentLocation.latitude,
      srcLng: assignedServiceProvider.currentLocation.longitude,
      dstLat: emergencyRequestDetails.location.latitude,
      dstLng: emergencyRequestDetails.location.longitude,
    });

    if (!optimalPath) {
      throw new ApiError(400, "Error getting optimal path");
    }

    const newEmergencyResponse = await db
      .insert(emergencyResponse)
      .values({
        emergencyRequestId,
        serviceProviderId,
        assignedAt: new Date(emergencyRequestDetails.createdAt),
      })
      .returning({
        id: emergencyResponse.id,
        emergencyRequestId: emergencyResponse.emergencyRequestId,
        serviceProviderId: emergencyResponse.serviceProviderId,

        statusUpdate: emergencyResponse.statusUpdate,
        assignedAt: emergencyResponse.assignedAt,
        respondedAt: emergencyResponse.respondedAt,
        updateDescription: emergencyResponse.updateDescription,
      });

    if (!newEmergencyResponse) {
      throw new ApiError(500, "Error creating emergency response");
    }

    const updatedStatus = Promise.all([
      db
        .update(emergencyRequest)
        .set({
          requestStatus: "assigned",
        })
        .where(eq(emergencyRequest.id, emergencyRequestId)),
      db
        .update(serviceProvider)
        .set({
          serviceStatus: "assigned",
        })
        .where(eq(serviceProvider.id, serviceProviderId)),
    ]);

    if (!updatedStatus) {
      await db
        .delete(emergencyResponse)
        .where(eq(emergencyResponse.id, newEmergencyResponse[0].id));

      throw new ApiError(
        500,
        "Error updating emergency request and service provider status"
      );
    }

    res.status(201).json(
      new ApiResponse(201, "Emergency response created", {
        emergencyResponse: newEmergencyResponse,
        optimalPath,
      })
    );
  }
);

const getEmergencyResponse = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Emergency response ID is required");
    }

    const existingEmergencyResponse =
      await db.query.emergencyResponse.findFirst({
        where: eq(emergencyResponse.id, id),
      });

    if (!existingEmergencyResponse) {
      throw new ApiError(404, "Emergency response not found");
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "Emergency response found", emergencyResponse)
      );
  }
);

const updateEmergencyResponse = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { statusUpdate, updateDescription } = req.body;

    if (!id) {
      throw new ApiError(400, "Emergency response ID is required");
    }

    const existingEmergencyResponse =
      await db.query.emergencyResponse.findFirst({
        where: eq(emergencyResponse.id, id),
      });

    if (!existingEmergencyResponse) {
      throw new ApiError(404, "Emergency response not found");
    }

    const updatedEmergencyResponse = await db
      .update(emergencyResponse)
      .set({
        statusUpdate,
        updateDescription,
      })
      .where(eq(emergencyResponse.id, id))
      .returning({
        id: emergencyResponse.id,
        emergencyRequestId: emergencyResponse.emergencyRequestId,
        serviceProviderId: emergencyResponse.serviceProviderId,

        assignedAt: emergencyResponse.assignedAt,
        respondedAt: emergencyResponse.respondedAt,
        statusUpdate: emergencyResponse.statusUpdate,
        updateDescription: emergencyResponse.updateDescription,
      });

    if (!updatedEmergencyResponse) {
      throw new ApiError(500, "Error updating emergency response");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Emergency response updated",
          updatedEmergencyResponse
        )
      );
  }
);

const deleteEmergencyResponse = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Emergency response ID is required");
    }

    const existingEmergencyResponse =
      await db.query.emergencyResponse.findFirst({
        where: eq(emergencyResponse.id, id),
      });

    if (!existingEmergencyResponse) {
      throw new ApiError(404, "Emergency response not found");
    }

    const deletedEmergencyResponse = await db
      .delete(emergencyResponse)
      .where(eq(emergencyResponse.id, id))
      .returning({
        id: emergencyResponse.id,
        emergencyRequestId: emergencyResponse.emergencyRequestId,
        serviceProviderId: emergencyResponse.serviceProviderId,

        assignedAt: emergencyResponse.assignedAt,
        respondedAt: emergencyResponse.respondedAt,

        statusUpdate: emergencyResponse.statusUpdate,
        updateDescription: emergencyResponse.updateDescription,
      });

    if (!deletedEmergencyResponse) {
      throw new ApiError(500, "Error deleting emergency response");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Emergency response deleted",
          deletedEmergencyResponse
        )
      );
  }
);

export {
  createEmergencyResponse,
  getEmergencyResponse,
  updateEmergencyResponse,
  deleteEmergencyResponse,
};
