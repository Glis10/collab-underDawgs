export const getOtpMessage = (otpCode: string) => {
  return `Welcome to firstResQ. Your Login OTP Code is ${otpCode}`;
};

export enum SocketEventEnums {
  CONNECTION_EVENT = "connection",
  DISCONNECT_EVENT = "disconnect",

  AUTHORIZED_EVENT = "authorized",

  JOIN_EMERGENCY_ROOM = "joinEmergencyRoom",
  LEAVE_EMERGENCY_ROOM = "leaveEmergencyRoom",
  EMERGENCY_RESPONSE_CREATED = "emergencyResponseCreated",
  NOTIFICATION_CREATED = "notificationCreated",

  UPDATE_LOCATION = "updateLocation",
  SEND_LOCATION = "sendLocation",

  PROVIDER_FOUND = "providerFound",
  NEED_LOCATION = "needLocation",

  SOCKET_ERROR = "socketError",
}

export const SocketRoom = {
  USER: (id: string) => `user:${id}`,
  PROVIDER: (id: string) => `provider:${id}`,
  EMERGENCY: (id: string) => `emergency:${id}`,
};

export type SocketRoomType = ReturnType<
  (typeof SocketRoom)[keyof typeof SocketRoom]
>;
