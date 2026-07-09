import { requiredClientEnv } from "../env/client-env";

const API_BASE_URL = requiredClientEnv("VITE_BILLING_API_URL");

export type ApiEnvelope<T> = {
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
  success: true;
};

export async function billingApiGet<T>(path: string) {
  return billingApiRequest<T>(path);
}

export async function billingApiPost<T>(path: string, body?: unknown) {
  return billingApiRequest<T>(path, {
    body: body === undefined ? undefined : JSON.stringify(body),
    method: "POST"
  });
}

export async function billingApiPut<T>(path: string, body: unknown) {
  return billingApiRequest<T>(path, {
    body: JSON.stringify(body),
    method: "PUT"
  });
}

async function billingApiRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    let message = `Billing API request failed: ${response.status}`;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      // Keep the status-based fallback.
    }
    throw new Error(message);
  }

  const envelope = (await response.json()) as ApiEnvelope<T>;
  return envelope.data;
}
