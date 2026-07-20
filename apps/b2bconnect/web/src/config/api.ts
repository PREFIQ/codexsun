const b2bConnectApiUrl = import.meta.env.VITE_B2BCONNECT_API_URL ?? "http://127.0.0.1:7135";

export function getB2bConnectApiUrl() {
  return b2bConnectApiUrl;
}
