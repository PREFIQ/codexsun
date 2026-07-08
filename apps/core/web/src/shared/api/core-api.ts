const API_BASE_URL = import.meta.env.VITE_CORE_API_URL ?? "http://127.0.0.1:5530";

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
