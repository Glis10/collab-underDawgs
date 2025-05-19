import { serviceProvider, TServiceProvider, TUser, user } from "@/db/schema";
import { parse } from "cookie";
import { Server, Socket } from "socket.io";
import { verifyJWT } from "@/utils/tokens/jwtTokens";
import db from "@/db";
import { eq, and } from "drizzle-orm";
import { SocketEventEnums, SocketRoom, SocketRoomType } from "@/constants";
import ApiError from "@/utils/api/ApiError";
import type { Request } from "express";
import { calculateDistance } from "@/utils/distance";
import { serviceTypeEnum, serviceStatusEnum } from "@/db/schema/enums";

type SocketUser = Socket & {
  user?: Partial<TUser | TServiceProvider>;
};

interface LocationData {
  latitude: string;
  longitude: string;
}

interface LocationUpdatePayload {
  emergencyResponseId: string;
  location: LocationData;
}

interface ServiceProviderWithDistance
  extends Pick<
    TServiceProvider,
    "id" | "name" | "currentLocation" | "serviceType" | "serviceStatus"
  > {
  distance: number;
}

const mountJoinRoomEvent = (socket: SocketUser) => {
  socket.on(
    SocketEventEnums.JOIN_EMERGENCY_ROOM,
    ({
      emergencyResponseId,
      userId,
      providerId,
    }: {
      emergencyResponseId: string;
      userId: string;
      providerId: string;
    }) => {
      const room = SocketRoom.EMERGENCY(emergencyResponseId);
      socket.join(room);
      console.log(
        `[SOCKET] ${socket.id} joined room emergency:${emergencyResponseId}`
      );
    }
  );
};

const mountSendLocationEvent = (socket: SocketUser) => {
  socket.on(
    SocketEventEnums.SEND_LOCATION,
    async ({ emergencyResponseId, location }: LocationUpdatePayload) => {
      try {
        if (!socket.user?.id) {
          console.log("No user ID found in socket");
          return;
        }

        if (!location || !location.latitude || !location.longitude) {
          console.log("Invalid location data");
          return;
        }

        // Convert location to string format for database
        const locationString = {
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
        };

        console.log("[DEBUG] Updating provider location:", {
          providerId: socket.user.id,
          location: locationString,
        });

        // Update provider's location in database
        // const updated = await db
        //   .update(serviceProvider)
        //   .set({ currentLocation: locationString })
        //   .where(eq(serviceProvider.id, socket.user?.id))
        //   .returning({
        //     id: serviceProvider.id,
        //     name: serviceProvider.name,
        //     currentLocation: serviceProvider.currentLocation,
        //     serviceStatus: serviceProvider.serviceStatus,
        //   });

        // if (updated.length === 0) {
        //   console.log("Failed to update provider location");
        //   return;
        // }

        // console.log(
        //   "[DEBUG] Provider location updated successfully:",
        //   updated[0]
        // );

        // Broadcast location update to all users in the emergency room
        socket
          .to(SocketRoom.EMERGENCY(emergencyResponseId))
          .emit(SocketEventEnums.UPDATE_LOCATION, {
            providerId: socket.user?.id,
            location: locationString,
            timestamp: new Date().toISOString(),
          });

        console.log(`[SOCKET] Location sent from ${socket.user?.id}`);
      } catch (error) {
        console.log("[SOCKET] Error in location update:", error);
        socket.emit(SocketEventEnums.SOCKET_ERROR, {
          message: "Failed to update location",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );
};

const mountUserLocationEvent = (socket: SocketUser) => {
  socket.on(
    SocketEventEnums.SEND_USER_LOCATION,
    async ({ emergencyResponseId, location }: LocationUpdatePayload) => {
      try {
        console.log("USER IN SOCKET", socket.user);

        if (!socket.user?.id) {
          console.log("No user ID found in socket");
          return;
        }

        if (!location || !location.latitude || !location.longitude) {
          console.log("Invalid user location data");
          return;
        }

        // Convert location to string format for database
        const locationString = {
          latitude: location.latitude,
          longitude: location.longitude,
        };

        console.log("location Update", locationString);

        // Update user's location in database
        if (socket.user.id) {
          const updated = await db
            .update(user)
            .set({ currentLocation: locationString })
            .where(eq(user.id, socket.user?.id))
            .returning({
              id: user.id,
              currentLocation: user.currentLocation,
            });

          if (updated.length === 0) {
            console.log("Failed to update user location");
            return;
          }
        }

        // Broadcast location update to all providers in the emergency room
        socket
          .to(SocketRoom.EMERGENCY(emergencyResponseId))
          .emit(SocketEventEnums.UPDATE_USER_LOCATION, {
            userId: socket.user?.id,
            location: locationString,
            timestamp: new Date().toISOString(),
          });

        console.log(`[SOCKET] User location sent from ${socket.user?.id}`);
      } catch (error) {
        console.log("[SOCKET] Error in user location update:", error);
        socket.emit(SocketEventEnums.SOCKET_ERROR, {
          message: "Failed to update user location",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );
};

const mountProviderFoundEvent = (socket: SocketUser) => {
  socket.on(
    SocketEventEnums.PROVIDER_FOUND,
    ({ emergencyResponseId }: { emergencyResponseId: string }) => {
      // Emit needLocation event to all providers in the emergency room
      socket
        .to(SocketRoom.EMERGENCY(emergencyResponseId))
        .emit(SocketEventEnums.NEED_LOCATION, {
          emergencyResponseId,
        });

      console.log(
        `[SOCKET] Need location event emitted for emergency: ${emergencyResponseId}`
      );
    }
  );
};

const mountRequestEmergencyServiceEvent = (socket: SocketUser) => {
  socket.on(
    SocketEventEnums.REQUEST_EMERGENCY_SERVICE,
    async ({
      serviceType,
      userLocation,
    }: {
      serviceType: (typeof serviceTypeEnum.enumValues)[number];
      userLocation: LocationData;
    }) => {
      try {
        if (!socket.user?.id) {
          console.log("No user ID found in socket");
          return;
        }

        // Get all available service providers of the requested type
        const providers = await db.query.serviceProvider.findMany({
          where: and(
            eq(serviceProvider.serviceType, serviceType),
            eq(serviceProvider.serviceStatus, serviceStatusEnum.AVAILABLE)
          ),
          columns: {
            id: true,
            name: true,
            currentLocation: true,
            serviceType: true,
            serviceStatus: true,
          },
        });

        const providersWithDistance: ServiceProviderWithDistance[] = providers
          .filter((provider) => provider.currentLocation)
          .map((provider) => ({
            ...provider,
            distance: calculateDistance(
              userLocation,
              provider.currentLocation!
            ),
          }))
          .sort((a, b) => a.distance - b.distance);

        socket.emit(SocketEventEnums.PROVIDER_FOUND, {
          providers: providersWithDistance,
        });

        console.log(
          `[SOCKET] Found ${providersWithDistance.length} available providers for ${serviceType}`
        );
      } catch (error) {
        console.log("[SOCKET] Error in emergency service request:", error);
        socket.emit(SocketEventEnums.SOCKET_ERROR, {
          message: "Failed to find service providers",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );
};

const mountUpdateProviderStatusEvent = (socket: SocketUser) => {
  socket.on(
    SocketEventEnums.UPDATE_PROVIDER_STATUS,
    async ({
      status,
    }: {
      status: (typeof serviceStatusEnum)[keyof typeof serviceStatusEnum];
    }) => {
      try {
        if (!socket.user?.id) {
          console.log("No user ID found in socket");
          return;
        }

        // Update provider status in database
        const updated = await db
          .update(serviceProvider)
          .set({ serviceStatus: status })
          .where(eq(serviceProvider.id, socket.user.id))
          .returning({
            id: serviceProvider.id,
            serviceStatus: serviceProvider.serviceStatus,
          });

        if (updated.length === 0) {
          console.log("Failed to update provider status");
          return;
        }

        // Broadcast status update to all users
        socket.broadcast.emit(SocketEventEnums.PROVIDER_STATUS_UPDATED, {
          providerId: socket.user.id,
          status,
        });

        console.log(
          `[SOCKET] Provider ${socket.user.id} status updated to ${status}`
        );
      } catch (error) {
        console.log("[SOCKET] Error in provider status update:", error);
        socket.emit(SocketEventEnums.SOCKET_ERROR, {
          message: "Failed to update provider status",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );
};

const authenticateUser = async (socket: SocketUser) => {
  const cookies = parse((socket.handshake.headers?.cookie as string) || "");

  let token = cookies?.token;
  if (!token) token = socket.handshake.auth.token;
  if (!token) throw new ApiError(401, "Unauthorized");

  const decoded = verifyJWT(token) as Partial<TUser>;
  if (!decoded || !decoded.id) throw new ApiError(401, "Unauthorized");

  const userEntity = await db.query.user.findFirst({
    where: eq(user.id, decoded.id),
    columns: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      role: true,
      isVerified: true,
    },
  });

  if (userEntity) {
    socket.user = userEntity;
    socket.join(SocketRoom.USER(userEntity.id));
    console.log("User connected 🗼. userId: ", userEntity.id.toString());
  } else {
    const serviceProviderEntity = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, decoded.id),
      columns: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        isVerified: true,
        organizationId: true,
      },
    });

    if (!serviceProviderEntity) {
      throw new ApiError(401, "Unidentified Role. Please Login again.");
    }

    socket.user = serviceProviderEntity;
    socket.join(SocketRoom.PROVIDER(serviceProviderEntity.id));
    console.log(
      "Service Provider connected 🗼. providerId: ",
      serviceProviderEntity.id.toString()
    );
  }

  socket.emit(SocketEventEnums.CONNECTION_EVENT);
  socket.emit(SocketEventEnums.AUTHORIZED_EVENT);
};

const handleSocketConnection = async (socket: SocketUser) => {
  try {
    await authenticateUser(socket);

    mountJoinRoomEvent(socket);
    mountSendLocationEvent(socket);
    mountUserLocationEvent(socket);
    mountProviderFoundEvent(socket);
    mountRequestEmergencyServiceEvent(socket);
    mountUpdateProviderStatusEvent(socket);

    socket.on(SocketEventEnums.DISCONNECT_EVENT, () => {
      console.log(
        "[SOCKET]: User has disconnected 🚫. userId: " + socket.user?.id
      );
      if (socket.user?.id) {
        socket.leave(socket.user.id);
      }
    });
  } catch (error) {
    console.log("[SOCKET]: Error authenticating user", error);
    socket.emit(
      SocketEventEnums.SOCKET_ERROR,
      error instanceof Error
        ? error.message
        : "Something went wrong while connecting to the socket."
    );
  }
};

const initializeSocketIo = (io: Server) => {
  return io.on(SocketEventEnums.CONNECTION_EVENT, handleSocketConnection);
};

const emitSocketEvent = (
  req: Request,
  roomId: SocketRoomType,
  event: SocketEventEnums,
  payload: any
) => {
  console.log("[SOCKET] Emitting event:", event, roomId);
  req.app.get("io").in(roomId).emit(event, payload);
};

export { initializeSocketIo, emitSocketEvent };
