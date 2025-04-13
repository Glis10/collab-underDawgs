import { serviceProvider, TUser, user } from "@/db/schema";
import cookie from "cookie";
import { Server, Socket } from "socket.io";
import { verifyJWT } from "@/utils/tokens/jwtTokens";
import db from "@/db";
import { eq } from "drizzle-orm";
import { SocketEventEnums } from "@/constants";
import ApiError from "@/utils/api/ApiError";
import type { Request } from "express";

type SocketUser = Socket & { user?: Partial<TUser> };

const mountJoinRoomEvent = (socket: SocketUser) => {
  socket.on(
    SocketEventEnums.JOIN_EMERGENCY_ROOM,
    ({ emergencyResponseId, userId, providerId }) => {
      const room = `emergency:${emergencyResponseId}`;
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
    ({ emergencyResponseId, providerLocation }) => {
      socket
        .in(`emergency:${emergencyResponseId}`)
        .emit(SocketEventEnums.UPDATE_LOCATION, {
          userId: socket.user?.id,
          location: providerLocation,
        });
      console.log(`[SOCKET] Location sent from ${socket.user?.id}`);
    }
  );
};

const mountHandleLocationUpdate = (socket: SocketUser) => {
  socket.on(SocketEventEnums.UPDATE_LOCATION, async ({ location }) => {
    if (!socket.user?.id) return;

    const updateProvider = await db
      .update(serviceProvider)
      .set({
        currentLocation: location,
      })
      .where(eq(serviceProvider.id, socket.user?.id))
      .returning({
        id: serviceProvider.id,
        currentLocation: serviceProvider.currentLocation,
      });

    if (updateProvider.length === 0) {
      throw new ApiError(500, "Error updating provider location");
    }

    console.log(
      `[SOCKET] Location Update from ${socket.user?.id}, ${location}`
    );
  });
};

const authenticateUser = async (socket: SocketUser) => {
  const cookies = cookie.parse(socket.request.headers.cookie || "");
  let token = cookies?.accessToken;
  if (!token) token = socket.handshake.auth.token;
  if (!token) throw new ApiError(401, "Unauthorized");

  const decoded = verifyJWT(token) as Partial<TUser>;
  if (!decoded || !decoded.id) throw new ApiError(401, "Unauthorized");

  let loggedInEntity = null;
  loggedInEntity = await db.query.user.findFirst({
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

  if (!loggedInEntity) {
    loggedInEntity = await db.query.serviceProvider.findFirst({
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
  }

  if (!loggedInEntity) throw new ApiError(401, "Unauthorized");
  socket.user = loggedInEntity;
  socket.join(loggedInEntity.id);
  socket.emit(SocketEventEnums.CONNECTION_EVENT);
  socket.emit(SocketEventEnums.AUTHORIZED_EVENT);
  console.log("User connected 🗼. userId: ", loggedInEntity.id.toString());
};

const handleSocketConnection = async (socket: SocketUser) => {
  try {
    await authenticateUser(socket);

    mountJoinRoomEvent(socket);
    mountSendLocationEvent(socket);
    mountHandleLocationUpdate(socket);

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
  roomId: string,
  event: SocketEventEnums,
  payload: any
) => {
  req.app.get("io").in(roomId).emit(event, payload);
};

export { initializeSocketIo, emitSocketEvent };
