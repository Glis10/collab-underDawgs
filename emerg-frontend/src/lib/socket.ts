import { API_BASE_URL, getAuthToken } from '@/src/lib/auth';
import { io, Socket } from 'socket.io-client';

export const SOCKET_EVENTS = {
  newRequest: 'new_request',
  requestAccepted: 'request_accepted',
  requestDeclined: 'request_declined',
  requestStatusUpdated: 'request_status_updated',
  providerLocationUpdated: 'provider_location_updated',
  updateLocation: 'updateLocation',
  updateUserLocation: 'updateUserLocation',
  emergencyResponseCreated: 'emergencyResponseCreated',
  emergencyResponseStatusUpdated: 'emergencyResponseStatusUpdated',
  receiveAlert: 'receiveAlert',
  joinEmergencyRoom: 'joinEmergencyRoom',
  sendLocation: 'sendLocation',
  sendUserLocation: 'sendUserLocation',
  locationUpdate: 'locationUpdate',
} as const;

let socket: Socket | null = null;

function getSocketUrl() {
  if (!API_BASE_URL) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL in emerg-frontend/.env');
  }

  return API_BASE_URL.replace(/\/api\/?$/, '');
}

export function getEmergencySocket() {
  const token = getAuthToken();

  if (!token) {
    return null;
  }

  if (!socket) {
    // A single shared socket avoids duplicate connections when users switch tabs.
    socket = io(getSocketUrl(), {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 700,
    });
  } else {
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
  }

  return socket;
}

export function disconnectEmergencySocket() {
  socket?.disconnect();
  socket = null;
}
