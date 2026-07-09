import { requiredClientEnv } from "../env/client-env";

const API_BASE_URL = requiredClientEnv("VITE_CORE_API_URL");

export type ApiEnvelope<T> = {
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
  success: true;
};

export async function coreApiGet<T>(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Core API request failed: ${response.status}`);
  }

  const envelope = (await response.json()) as ApiEnvelope<T>;
  return envelope.data;
}

export async function coreApiPost<T>(path: string, body: unknown) {
  return coreApiWrite<T>("POST", path, body);
}

export async function coreApiPut<T>(path: string, body: unknown) {
  return coreApiWrite<T>("PUT", path, body);
}

async function coreApiWrite<T>(method: "POST" | "PUT", path: string, body: unknown) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: JSON.stringify(body),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    method
  });

  if (!response.ok) {
    throw new Error(`Core API request failed: ${response.status}`);
  }

  const envelope = (await response.json()) as ApiEnvelope<T>;
  return envelope.data;
}
