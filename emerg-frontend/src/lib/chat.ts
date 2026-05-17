import { API_BASE_URL, getCurrentUser } from '@/src/lib/auth';

export type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
};

type ChatResponse = {
  conversationId: string;
  reply: string;
  messages?: ChatMessage[];
};

export async function sendAssistantMessage(message: string, conversationId?: string): Promise<ChatResponse> {
  if (!API_BASE_URL) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL in emerg-frontend/.env');
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        message,
        userId: getCurrentUser()?.id,
      }),
    });
  } catch {
    throw new Error('Could not reach EmerG assistant. Make sure the backend is running.');
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || 'EmerG assistant is unavailable right now.');
  }

  if (!payload?.data?.reply || !payload?.data?.conversationId) {
    throw new Error('EmerG assistant returned an invalid response.');
  }

  return payload.data;
}
