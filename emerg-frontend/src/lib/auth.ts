import { Platform } from 'react-native';

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
};

type AuthPayload = {
  token: string;
  user: AuthUser;
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

const FALLBACK_API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || FALLBACK_API_BASE_URL;

function normalizePhoneNumber(phoneNumber: string) {
  return phoneNumber.replace(/\D/g, '');
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;

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

export async function registerUser(input: RegisterInput): Promise<AuthPayload> {
  const normalizedPhoneNumber = normalizePhoneNumber(input.phoneNumber);

  if (!normalizedPhoneNumber) {
    throw new Error('Please enter a valid phone number.');
  }

  return apiRequest<AuthPayload>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      phoneNumber: normalizedPhoneNumber,
    }),
  });
}

export async function loginUser(input: LoginInput): Promise<AuthPayload> {
  const normalizedPhoneNumber = normalizePhoneNumber(input.phoneNumber);

  if (!normalizedPhoneNumber) {
    throw new Error('Please enter a valid phone number.');
  }

  return apiRequest<AuthPayload>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      phoneNumber: normalizedPhoneNumber,
    }),
  });
}

export async function forgotPassword(email: string): Promise<{ userId: string }> {
  return apiRequest<{ userId: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}
