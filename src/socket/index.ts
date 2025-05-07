import { serviceProvider, TServiceProvider, TUser, user } from "@/db/schema";
import { parse } from "cookie";
import { Server, Socket } from "socket.io";
import { verifyJWT } from "@/utils/tokens/jwtTokens";
import db from "@/db";
import { eq } from "drizzle-orm";
import { SocketEventEnums, SocketRoom, SocketRoomType } from "@/constants";
import ApiError from "@/utils/api/ApiError";
import type { Request } from "express";

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
          console.error("No user ID found in socket");
          return;
        }

        if (!location || !location.latitude || !location.longitude) {
          console.error("Invalid location data");
          return;
        }

        // Convert location to string format for database
        const locationString = {
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
        };

        // Update provider's location in database
        const updated = await db
          .update(serviceProvider)
          .set({ currentLocation: locationString })
          .where(eq(serviceProvider.id, socket.user?.id))
          .returning({
            id: serviceProvider.id,
            currentLocation: serviceProvider.currentLocation,
          });

        if (updated.length === 0) {
          console.error("Failed to update provider location");
          return;
        }

        // Broadcast location update to all users in the emergency room
        socket
          .to(SocketRoom.EMERGENCY(emergencyResponseId))
          .emit(SocketEventEnums.UPDATE_LOCATION, {
            userId: socket.user?.id,
            location: locationString,
            timestamp: new Date().toISOString(),
          });

        console.log(`[SOCKET] Location sent from ${socket.user?.id}`);
      } catch (error) {
        console.error("[SOCKET] Error in location update:", error);
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
        if (!socket.user?.id) {
          console.error("No user ID found in socket");
          return;
        }

        if (!location || !location.latitude || !location.longitude) {
          console.error("Invalid user location data");
          return;
        }

        // Convert location to string format for database
        const locationString = {
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
        };

        // Update user's location in database
        const updated = await db
          .update(user)
          .set({ currentLocation: locationString })
          .where(eq(user.id, socket.user?.id))
          .returning({
            id: user.id,
            currentLocation: user.currentLocation,
          });

        if (updated.length === 0) {
          console.error("Failed to update user location");
          return;
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
        console.error("[SOCKET] Error in user location update:", error);
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

    socket.on(SocketEventEnums.DISCONNECT_EVENT, () => {
      console.log(
        "[SOCKET]: User has disconnected 🚫. userId: " + socket.user?.id
      );
      if (socket.user?.id) {
        socket.leave(socket.user.id);
      }
    });
  } catch (error) {
    console.error("[SOCKET]: Error authenticating user", error);
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
  req.app.get("io").in(roomId).emit(event, payload);
};

export { initializeSocketIo, emitSocketEvent };
