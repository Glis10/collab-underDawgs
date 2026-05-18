type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  success?: boolean;
  statusCode?: number;
};

export type AuthUser = {
  id: string;
  name: string;
  age: number;
  email: string;
  phoneNumber: string;
  primaryAddress: string;
  role: 'user' | 'admin';
  currentLocation?: EmergencyLocation | null;
  serviceStatus?: string;
  serviceType?: ServiceType;
};

type AuthPayload = {
  token: string;
  user: AuthUser;
};

type RegisterPayload = {
  userId: string;
  email: string;
};

type ServiceType = 'ambulance' | 'police' | 'fire_truck';

type ServiceProviderInput = {
  name: string;
  age: number;
  email: string;
  phoneNumber: string;
  primaryAddress: string;
  password: string;
  serviceType: ServiceType;
  organizationId: string;
};

type ServiceProviderPayload = {
  serviceProvider: {
    name: string;
    age: number;
    email: string;
    phoneNumber: number;
    primaryAddress: string;
    serviceType: ServiceType;
  };
};

type LoginInput = {
  phoneNumber: string;
  password: string;
};

type RegisterInput = {
  name: string;
  age: number;
  email: string;
  phoneNumber: string;
  primaryAddress: string;
  password: string;
};

export type EmergencyContact = {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  userId?: string | null;
  isCommanContact?: boolean;
  isCommonContact?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type EmergencyContactInput = {
  name: string;
  relationship: string;
  phoneNumber: string;
};

export type EmergencyLocation = {
  latitude: string;
  longitude: string;
};

type OptimalRouteInput = {
  srcLat: string;
  srcLng: string;
  dstLat: string;
  dstLng: string;
  mode?: 'DRIVING' | 'WALKING' | 'BICYCLING';
};

export type EmergencyRequest = {
  id: string;
  emergencyRequestId?: string;
  userId: string;
  serviceType?: ServiceType;
  emergencyType?: ServiceType;
  requestStatus?: string;
  status?: string;
  requestTime?: string;
  dispatchTime?: string | null;
  arrivalTime?: string | null;
  description?: string;
  emergencyDescription?: string;
  location?: EmergencyLocation;
  emergencyLocation?: EmergencyLocation;
  currentLocation?: EmergencyLocation;
  locationName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminEmergencyRequest = {
  id: string;
  userId: string;
  emergencyType?: 'medical' | 'police' | 'fire';
  serviceType?: ServiceType;
  coordinates?: EmergencyLocation;
  locationName?: string;
  timestamp?: string;
  description?: string;
  requestStatus: string;
  status?: string;
  requester?: {
    id: string;
    name: string;
    phoneNumber?: string;
    email?: string;
    primaryAddress?: string;
    currentLocation?: EmergencyLocation | null;
  } | null;
  responderDetails?: {
    id: string;
    name: string;
    serviceType: ServiceType;
    serviceStatus: string;
    phoneNumber?: string;
    currentLocation?: EmergencyLocation | null;
  } | null;
  tracking?: {
    requestedAt?: string;
    approvedAt?: string | null;
    dispatchedAt?: string | null;
    arrivedAt?: string | null;
    lastUpdatedAt?: string;
  };
};

export type EmergencyTrackingDetails = AdminEmergencyRequest;

type AdminEmergencyListPayload = {
  emergencies: AdminEmergencyRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type EmergencyRequestInput = {
  emergencyType: ServiceType;
  emergencyDescription: string;
  userLocation: EmergencyLocation;
  locationSource?: 'auto' | 'manual';
};

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

let authToken: string | null = null;
let currentUser: AuthUser | null = null;
let authRevision = 0;
const authListeners = new Set<() => void>();

function notifyAuthListeners() {
  authRevision += 1;
  authListeners.forEach((listener) => listener());
}

function normalizePhoneNumber(phoneNumber: string) {
  return phoneNumber.replace(/\D/g, '');
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;

  if (!API_BASE_URL) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL in emerg-frontend/.env');
  }

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
  } catch {
    throw new Error(`Could not reach backend at ${API_BASE_URL}. Make sure the backend is running and your phone and laptop are on the same network.`);
  }

  let payload: ApiEnvelope<T>;

  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error('Backend returned an invalid response.');
  }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || 'Request failed');
  }

  if (payload.data === undefined) {
    throw new Error('Invalid server response');
  }

  return payload.data;
}

async function apiRequestAllowEmpty<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;

  if (!API_BASE_URL) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL in emerg-frontend/.env');
  }

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
  } catch {
    throw new Error(`Could not reach backend at ${API_BASE_URL}. Make sure the backend is running and your phone and laptop are on the same network.`);
  }

  let payload: ApiEnvelope<T>;

  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error('Backend returned an invalid response.');
  }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data ?? ({ message: payload.message } as T);
}

export async function registerUser(input: RegisterInput): Promise<RegisterPayload> {
  const normalizedPhoneNumber = normalizePhoneNumber(input.phoneNumber);

  if (normalizedPhoneNumber.length !== 10) {
    throw new Error('Phone number must be exactly 10 digits.');
  }

  return apiRequest<RegisterPayload>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      phoneNumber: normalizedPhoneNumber,
    }),
  });
}

export async function verifyRegistration(userId: string, otpToken: string): Promise<AuthPayload> {
  const payload = await apiRequest<AuthPayload>('/auth/verify-registration', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      otpToken,
    }),
  });

  authToken = payload.token;
  currentUser = payload.user;
  notifyAuthListeners();

  return payload;
}

export async function loginUser(input: LoginInput): Promise<AuthPayload> {
  const normalizedPhoneNumber = normalizePhoneNumber(input.phoneNumber);

  if (normalizedPhoneNumber.length !== 10) {
    throw new Error('Phone number must be exactly 10 digits.');
  }

  const payload = await apiRequest<AuthPayload>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      phoneNumber: normalizedPhoneNumber,
    }),
  });

  authToken = payload.token;
  currentUser = payload.user;
  notifyAuthListeners();

  return payload;
}

export function getCurrentUser() {
  return currentUser;
}

export function getAuthRevision() {
  return authRevision;
}

export function subscribeAuthChanges(listener: () => void) {
  authListeners.add(listener);

  return () => {
    authListeners.delete(listener);
  };
}

export function updateCurrentUserName(name: string) {
  if (!currentUser) {
    return;
  }

  currentUser = {
    ...currentUser,
    name,
  };
  notifyAuthListeners();
}

export async function updateMyProfile(input: Partial<Pick<AuthUser, 'name' | 'email' | 'phoneNumber' | 'primaryAddress'>>): Promise<AuthUser> {
  const token = requireAuthToken('Please sign in again before updating your profile.');

  const user = await apiRequest<AuthUser>('/auth/me/profile', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  currentUser = {
    ...(currentUser || user),
    ...user,
  };
  notifyAuthListeners();

  return currentUser;
}

export function logoutUser() {
  authToken = null;
  currentUser = null;
  notifyAuthListeners();
}

export async function createServiceProviderCredentials(input: ServiceProviderInput): Promise<ServiceProviderPayload> {
  const normalizedPhoneNumber = normalizePhoneNumber(input.phoneNumber);

  if (!authToken) {
    throw new Error('Please sign in as admin before creating service provider credentials.');
  }

  if (!normalizedPhoneNumber) {
    throw new Error('Please enter a valid phone number.');
  }

  return apiRequest<ServiceProviderPayload>('/v1/service-provider/register', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      ...input,
      phoneNumber: normalizedPhoneNumber,
    }),
  });
}

export async function createEmergencyRequest(input: EmergencyRequestInput): Promise<{ emergencyRequest: EmergencyRequest }> {
  const token = requireAuthToken('Please sign in again before requesting emergency help.');

  return apiRequest<{ emergencyRequest: EmergencyRequest }>('/v1/emergency-request', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
}

export async function getEmergencyRequests(): Promise<EmergencyRequest[]> {
  const token = requireAuthToken('Please sign in again before loading emergency requests.');

  return apiRequest<EmergencyRequest[]>('/v1/emergency-request/recent', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getEmergencyRequestDetails(id: string): Promise<EmergencyTrackingDetails> {
  const token = requireAuthToken('Please sign in again before tracking this request.');

  return apiRequest<EmergencyTrackingDetails>(`/emergency/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateMyLocation(location: EmergencyLocation): Promise<AuthUser> {
  const token = requireAuthToken('Please sign in again before sharing your location.');

  const user = await apiRequest<AuthUser>('/auth/me/location', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(location),
  });

  if (currentUser) {
    currentUser = {
      ...currentUser,
      ...user,
    };
  }

  return user;
}

export async function getOptimalRoute(input: OptimalRouteInput): Promise<unknown> {
  const token = requireAuthToken('Please sign in again before loading route directions.');
  const params = new URLSearchParams({
    srcLat: input.srcLat,
    srcLng: input.srcLng,
    dstLat: input.dstLat,
    dstLng: input.dstLng,
    mode: input.mode || 'DRIVING',
  });

  return apiRequest<unknown>(`/v1/maps/optimal-route?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function cancelEmergencyRequest(id: string): Promise<EmergencyRequest> {
  const token = requireAuthToken('Please sign in again before cancelling emergency requests.');

  return apiRequest<EmergencyRequest>(`/v1/emergency-request/${id}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getAdminEmergencyRequests(status: 'active' | 'completed' | 'rejected' = 'active'): Promise<AdminEmergencyRequest[]> {
  const token = requireAuthToken('Please sign in as admin before loading emergency requests.');

  const payload = await apiRequest<AdminEmergencyListPayload>(`/admin/emergencies?status=${status}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return payload.emergencies;
}

export async function approveAdminEmergencyRequest(id: string): Promise<AdminEmergencyRequest> {
  const token = requireAuthToken('Please sign in as admin before accepting emergency requests.');

  return apiRequest<AdminEmergencyRequest>(`/admin/emergencies/${id}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ note: 'Accepted from admin dashboard' }),
  });
}

export async function rejectAdminEmergencyRequest(id: string): Promise<AdminEmergencyRequest> {
  const token = requireAuthToken('Please sign in as admin before declining emergency requests.');

  return apiRequest<AdminEmergencyRequest>(`/admin/emergencies/${id}/reject`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason: 'Declined from admin dashboard' }),
  });
}

export async function resolveAdminEmergencyRequest(id: string): Promise<AdminEmergencyRequest> {
  const token = requireAuthToken('Please sign in as admin before resolving emergency requests.');

  return apiRequest<AdminEmergencyRequest>(`/emergency/${id}/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: 'resolved' }),
  });
}

export async function forgotPassword(email: string): Promise<{ userId: string }> {
  return apiRequest<{ userId: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

type ResetPasswordInput = {
  userId: string;
  otpToken: string;
  password: string;
};

export async function resetPassword(input: ResetPasswordInput): Promise<{ message?: string }> {
  return apiRequestAllowEmpty<{ message?: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

function requireAuthToken(message = 'Please sign in again before managing emergency contacts.') {
  if (!authToken) {
    throw new Error(message);
  }

  return authToken;
}

export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
  const token = requireAuthToken();

  return apiRequest<EmergencyContact[]>('/v1/emergency-contacts', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getCommonEmergencyContacts(): Promise<EmergencyContact[]> {
  return apiRequest<EmergencyContact[]>('/v1/emergency-contacts/common/all', {
    method: 'GET',
  });
}

export async function createEmergencyContact(input: EmergencyContactInput): Promise<EmergencyContact> {
  const token = requireAuthToken();
  const normalizedPhoneNumber = normalizePhoneNumber(input.phoneNumber);

  if (!input.name.trim() || !input.relationship.trim() || !normalizedPhoneNumber) {
    throw new Error('Please enter a name, relationship, and valid phone number.');
  }

  return apiRequest<EmergencyContact>('/v1/emergency-contacts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: input.name.trim(),
      relationship: input.relationship.trim(),
      phoneNumber: normalizedPhoneNumber,
    }),
  });
}

export async function deleteEmergencyContact(id: string): Promise<EmergencyContact> {
  const token = requireAuthToken();

  return apiRequest<EmergencyContact>(`/v1/emergency-contacts/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
