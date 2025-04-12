export const getOtpMessage = (otpCode: string) => {
  return `Welcome to firstResQ. Your Login OTP Code is ${otpCode}`;
};

export enum SocketEventEnums {
  CONNECTED_EVENT = "connected",
  DISCONNECT_EVENT = "disconnect",
  JOIN_EMERGENCY_ROOM = "joinEmergencyRoom",
  LEAVE_EMERGENCY_ROOM = "leaveEmergencyRoom",
  UPDATE_LOCATION = "updateLocation",
  SOCKET_ERROR = "socketError",
}
