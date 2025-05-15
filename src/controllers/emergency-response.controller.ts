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
import { emitSocketEvent } from "@/socket";
import { SocketEventEnums, SocketRoom } from "@/constants";
import { getBestServiceProvider } from "@/utils/maps";
import { createNearServiceProviders } from "@/utils";
import { createNotification } from "./notification.controller";

const createEmergencyResponse = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInUser = req.user;

    if (!loggedInUser || !loggedInUser.id) {
      console.error("Please login to perform this action");
      throw new ApiError(400, "Please login to perform this action");
    }

    console.log("[DEBUG] Emergency response request body:", req.body);
    console.log("[DEBUG] Logged in user:", loggedInUser);

    let { emergencyRequestId, destLocation } = req.body;

    if (!emergencyRequestId) {
      console.error("Emergency ID are required");
      throw new ApiError(400, "Emergency ID are required");
    }

    const existingEmergencyResponse =
      await db.query.emergencyResponse.findFirst({
        where: and(
          eq(emergencyRequestId, emergencyResponse.emergencyRequestId)
        ),
      });

    if (existingEmergencyResponse) {
      console.error("Emergency response already exists");
      throw new ApiError(400, "Emergency response already exists");
    }

    if (!destLocation) {
      console.error(
        "No destLocation passed. Assigning user's default location"
      );
      destLocation = loggedInUser.currentLocation;
    }

    console.log("[DEBUG] Using destination location:", destLocation);

    const emergencyRequestDetails = await db.query.emergencyRequest.findFirst({
      where: eq(emergencyRequest.id, emergencyRequestId),
    });

    console.log("[DEBUG] Emergency request details:", emergencyRequestDetails);

    if (
      isNaN(parseFloat(destLocation.latitude)) ||
      isNaN(parseFloat(destLocation.longitude))
    ) {
      console.error("Invalid emergency location coordinates:", destLocation);
      throw new ApiError(400, "Invalid emergency location coordinates");
    }

    const emergencyRequestLocation = {
      latitude: parseFloat(destLocation.latitude),
      longitude: parseFloat(destLocation.longitude),
    };

    console.log("[DEBUG] Parsed emergency location:", emergencyRequestLocation);

    const emergencyRequestType = emergencyRequestDetails?.serviceType;

    if (!emergencyRequestType) {
      console.error("Emergency request type not found");
      throw new ApiError(400, "Emergency request type not found");
    }

    console.log("[DEBUG] Emergency request type:", emergencyRequestType);

    const bestServiceProvider = await getBestServiceProvider(
      emergencyRequestLocation,
      emergencyRequestType
    );

    console.log("[DEBUG] Best service provider found:", bestServiceProvider);

    if (!bestServiceProvider || !bestServiceProvider.id) {
      await db
        .delete(emergencyRequest)
        .where(eq(emergencyRequest.id, emergencyRequestId));

      console.error("No available service provider found");
      throw new ApiError(404, "No available service provider found");
    }

    const serviceProviderId = bestServiceProvider.id;

    // Update service provider's current location
    const updatedProvider = await db
      .update(serviceProvider)
      .set({
        currentLocation: {
          latitude: emergencyRequestLocation.latitude.toString(),
          longitude: emergencyRequestLocation.longitude.toString(),
        },
      })
      .where(eq(serviceProvider.id, serviceProviderId))
      .returning({
        id: serviceProvider.id,
        currentLocation: serviceProvider.currentLocation,
      });

    console.log("[DEBUG] Updated provider location:", updatedProvider);

    const assignedServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, serviceProviderId),
    });

    if (!assignedServiceProvider || !emergencyRequestDetails) {
      console.error("Service provider or emergency request not found");
      throw new ApiError(
        404,
        "Service provider or emergency request not found"
      );
    }

    if (
      !assignedServiceProvider.currentLocation ||
      !emergencyRequestDetails.location
    ) {
      console.error("Service provider or emergency request location not found");
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
      console.error(
        "Service provider or emergency request location coordinates not found"
      );
      throw new ApiError(
        404,
        "Service provider or emergency request location coordinates not found"
      );
    }

    let optimalPath;

    if (destLocation) {
      optimalPath = await getOptimalRoute({
        srcLat: assignedServiceProvider.currentLocation.latitude,
        srcLng: assignedServiceProvider.currentLocation.longitude,
        dstLat: destLocation.latitude,
        dstLng: destLocation.longitude,
      });
    } else {
      optimalPath = await getOptimalRoute({
        srcLat: assignedServiceProvider.currentLocation.latitude,
        srcLng: assignedServiceProvider.currentLocation.longitude,
        dstLat: emergencyRequestDetails.location.latitude,
        dstLng: emergencyRequestDetails.location.longitude,
      });
    }

    if (!optimalPath) {
      console.error("Error getting optimal path");
      throw new ApiError(400, "Error getting optimal path");
    }

    const newEmergencyResponse = await db
      .insert(emergencyResponse)
      .values({
        emergencyRequestId,
        serviceProviderId,
        assignedAt: new Date(emergencyRequestDetails.createdAt),
        originLocation: assignedServiceProvider.currentLocation,
        destinationLocation: emergencyRequestDetails.location,
      })
      .returning();

    if (!newEmergencyResponse) {
      console.error("Error creating emergency response");
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

    // Create notification for the service provider
    const providerNotification = await createNotification({
      serviceProviderId: assignedServiceProvider.id,
      userId: loggedInUser.id,
      message: `New emergency request assigned to you. Type: ${emergencyRequestType}`,
      type: "emergency",
      priority: "high",
      deliveryStatus: "unread",
      source: "system",
      metadata: {
        emergencyType: emergencyRequestType,
        location: emergencyRequestDetails?.location,
        distance: optimalPath?.distance || "Calculating...",
        userInfo: {
          name: loggedInUser.name,
          contact: loggedInUser.phoneNumber,
        },
      },
    });

    // Create notification for the user
    const userNotification = await createNotification({
      serviceProviderId: assignedServiceProvider.id,
      userId: loggedInUser.id,
      message: `Emergency request has been assigned to ${assignedServiceProvider.name}`,
      type: "emergency",
      priority: "high",
      deliveryStatus: "unread",
      source: "system",
      metadata: {
        emergencyType: emergencyRequestType,
        responderInfo: {
          name: assignedServiceProvider.name,
          vehicleType: assignedServiceProvider.serviceType,
          eta: optimalPath?.eta || "Calculating...",
          distance: optimalPath?.distance || "Calculating...",
        },
      },
    });

    // Emit socket events for notifications
    emitSocketEvent(
      req,
      SocketRoom.PROVIDER(assignedServiceProvider.id),
      SocketEventEnums.NOTIFICATION_CREATED,
      providerNotification
    );

    emitSocketEvent(
      req,
      SocketRoom.USER(loggedInUser.id),
      SocketEventEnums.NOTIFICATION_CREATED,
      userNotification
    );

    emitSocketEvent(
      req,
      SocketRoom.USER(loggedInUser.id),
      SocketEventEnums.EMERGENCY_RESPONSE_CREATED,
      {
        emergencyResponse: newEmergencyResponse[0],
        optimalPath,
      }
    );

    emitSocketEvent(
      req,
      SocketRoom.PROVIDER(assignedServiceProvider.id),
      SocketEventEnums.EMERGENCY_RESPONSE_CREATED,
      {
        emergencyResponse: newEmergencyResponse[0],
        optimalPath,
      }
    );

    if (!updatedStatus) {
      await db
        .delete(emergencyResponse)
        .where(eq(emergencyResponse.id, newEmergencyResponse[0].id));

      console.error(
        "Error updating emergency request and service provider status"
      );
      throw new ApiError(
        500,
        "Error updating emergency request and service provider status"
      );
    }

    console.log("Optimal path", optimalPath);
    console.log("New emergency response", newEmergencyResponse);

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
      console.error("Emergency response ID is required");
      throw new ApiError(400, "Emergency response ID is required");
    }

    const existingEmergencyResponse =
      await db.query.emergencyResponse.findFirst({
        where: eq(emergencyResponse.id, id),
      });

    if (!existingEmergencyResponse) {
      console.error("Emergency response not found");
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
      console.error("Emergency response ID is required");
      throw new ApiError(400, "Emergency response ID is required");
    }

    const existingEmergencyResponse =
      await db.query.emergencyResponse.findFirst({
        where: eq(emergencyResponse.id, id),
      });

    if (!existingEmergencyResponse) {
      console.error("Emergency response not found");
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
      console.error("Error updating emergency response");
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
      console.error("Emergency response ID is required");
      throw new ApiError(400, "Emergency response ID is required");
    }

    const existingEmergencyResponse =
      await db.query.emergencyResponse.findFirst({
        where: eq(emergencyResponse.id, id),
      });

    if (!existingEmergencyResponse) {
      console.error("Emergency response not found");
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
      console.error("Error deleting emergency response");
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
