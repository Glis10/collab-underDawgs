import { TUser, user } from "@/db/schema";
import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { envConfig } from "@/config/env.config";
import { verifyJWT } from "@/utils/tokens/jwtTokens";
import db from "@/db";
import { eq } from "drizzle-orm";
import { TNotification } from "@/db/schema/notification";

type SocketUser = Socket & { user?: Partial<TUser> };
const CONNECTIONS = new Array<SocketUser>();

const handleSocketConnection = (socket: SocketUser) => {
  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  setTimeout(() => {
    if (!socket.user) {
      socket.emit("error", "You are not authenticated");
      socket.disconnect();
    }
  }, 5 * 1000);

  socket.on("authenticate", async (token: string) => {
    if (!token) {
      socket.emit("error", "Token is required");
      socket.disconnect();
      return;
    }

    try {
      const decoded = verifyJWT(token) as Partial<TUser>;

      if (!decoded || !decoded.id) {
        socket.emit("error", "Invalid token");
        socket.disconnect();
        return;
      }

      const userInDb = await db.query.user.findFirst({
        where: eq(user.id, decoded.id),
      });

      if (!userInDb) {
        socket.emit("error", "User not found");
        socket.disconnect();
        return;
      }

      socket.user = decoded;
      console.log("User authenticated", socket.user);
      CONNECTIONS.push(socket);
    } catch (error) {
      socket.emit("error", "Error authenticating user");
      socket.disconnect();
    }
  });
};

const sendNotifications = (notification: TNotification) => {
  CONNECTIONS.forEach((socket) => {
    if (socket.user && socket.user.id === notification.userId) {
      socket.emit("notification", notification);
    }
  });
};

export { handleSocketConnection, sendNotifications };
