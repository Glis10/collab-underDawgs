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

  UPDATE_LOCATION = "updateLocation",
  SEND_LOCATION = "sendLocation",

  SOCKET_ERROR = "socketError",
}
