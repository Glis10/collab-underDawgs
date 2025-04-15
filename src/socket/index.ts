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

const mountJoinRoomEvent = (socket: SocketUser) => {
  socket.on(
    SocketEventEnums.JOIN_EMERGENCY_ROOM,
    ({ emergencyResponseId, userId, providerId }) => {
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
    async ({ emergencyResponseId, providerLocation }) => {
      if (!socket.user?.id) return;

      const updated = await db
        .update(serviceProvider)
        .set({ currentLocation: providerLocation })
        .where(eq(serviceProvider.id, socket.user?.id))
        .returning({
          id: serviceProvider.id,
          currentLocation: serviceProvider.currentLocation,
        });

      if (updated.length === 0) {
        console.error("Failed to update provider location");
        return;
      }

      socket
        .to(SocketRoom.EMERGENCY(emergencyResponseId))
        .emit(SocketEventEnums.UPDATE_LOCATION, {
          userId: socket.user?.id,
          location: providerLocation,
        });

      console.log(`[SOCKET] Location sent from ${socket.user?.id}`);
    }
  );
};

const mountProviderFoundEvent = (socket: SocketUser) => {
  socket.on(SocketEventEnums.PROVIDER_FOUND, ({ emergencyResponseId }) => {
    // Emit needLocation event to all providers in the emergency room
    socket
      .to(SocketRoom.EMERGENCY(emergencyResponseId))
      .emit(SocketEventEnums.NEED_LOCATION, {
        emergencyResponseId,
      });

    console.log(
      `[SOCKET] Need location event emitted for emergency: ${emergencyResponseId}`
    );
  });
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
      serviceProvider.id.toString()
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
    mountProviderFoundEvent(socket);

    socket.on(SocketEventEnums.DISCONNECT_EVENT, (error: string) => {
      console.log(
        "[SOCKET]: User has disconnected 🚫. userId: " + socket.user?.id
      );
      if (socket.user?.id) {
        socket.leave(socket.user.id);
      }
    });
  } catch (error: any) {
    console.error("[SOCKET]: Error authenticating user", error);
    socket.emit(
      SocketEventEnums.SOCKET_ERROR,
      error?.message || "Something went wrong while connecting to the socket."
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
