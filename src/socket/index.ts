import { serviceProvider, TUser, user } from "@/db/schema";
import cookie from "cookie";
import { Server, Socket } from "socket.io";
import { verifyJWT } from "@/utils/tokens/jwtTokens";
import db from "@/db";
import { eq } from "drizzle-orm";
import { TNotification } from "@/db/schema/notification";
import { SocketEventEnums } from "@/constants";
import ApiError from "@/utils/api/ApiError";
import type { Request } from "express";

type SocketUser = Socket & { user?: Partial<TUser> };

const mountJoinRoomEvent = (socket: SocketUser) => {
  socket.on(
    SocketEventEnums.JOIN_EMERGENCY_ROOM,
    ({ emergencyRequestId, userId, providerId }) => {
      const room = `emergency_${emergencyRequestId}`;
      socket.join(room);
      console.log(`${socket.id} joined ${room}`);
    }
  );
};

const authenticateUser = async (socket: SocketUser) => {
  const cookies = cookie.parse(socket.request.headers.cookie || "");
  let token = cookies?.accessToken;
  if (!token) token = socket.handshake.auth.token;
  if (!token) throw new ApiError(401, "Unauthorized");

  const decoded = verifyJWT(token) as Partial<TUser>;
  if (!decoded || !decoded.id) throw new ApiError(401, "Unauthorized");

  let loggedInEntity;
  loggedInEntity = await db.query.user.findFirst({
    where: eq(user.id, decoded.id),
  });

  if (!loggedInEntity) {
    loggedInEntity = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, decoded.id),
      columns: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
      },
    });
  }

  if (!loggedInEntity) throw new ApiError(401, "Unauthorized");
  socket.user = loggedInEntity;
  socket.join(loggedInEntity.id);
  socket.emit(SocketEventEnums.CONNECTED_EVENT);
  console.log("User connected 🗼. userId: ", loggedInEntity.id.toString());
};

const initializeSocketIo = (io: Server) => {
  return io.on(SocketEventEnums.CONNECTED_EVENT, handleSocketConnection);
};

const handleSocketConnection = (socket: SocketUser) => {
  try {
    authenticateUser(socket);

    socket.on(SocketEventEnums.SOCKET_ERROR, (error: string) => {
      console.log("user has disconnected 🚫. userId: " + socket.user?.id);
      if (socket.user?.id) {
        socket.leave(socket.user.id);
      }
    });
  } catch (error: any) {
    console.error("SOCKET: Error authenticating user", error);
    socket.emit(
      SocketEventEnums.SOCKET_ERROR,
      error?.message || "Something went wrong while connecting to the socket."
    );
  }
};

const findCurrentLocation = async (providerId: string) => {};

const emitSocketEvent = (
  req: Request,
  roomId: string,
  event: SocketEventEnums,
  payload: any
) => {
  req.app.get("io").in(roomId).emit(event, payload);
};

export { initializeSocketIo };
