import { getToken } from "../../../shared/api/tenant-context";
import { requiredClientEnv } from "../../../shared/env/client-env";

const platformApiUrl = requiredClientEnv("VITE_PLATFORM_API_URL");

type CompanyLogoVariant = "logo" | "logo-dark";
type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };

export async function uploadCompanyLogo(file: File, variant: CompanyLogoVariant) {
  if (!isSvg(file)) throw new Error("Choose an SVG logo file.");

  const response = await fetch(`${platformApiUrl}/tenant/media/company-logo`, {
    body: JSON.stringify({ contentBase64: await fileToBase64(file), variant }),
    headers: requestHeaders(),
    method: "POST"
  });
  const body = await response.json() as Envelope<{ path: string; variant: CompanyLogoVariant }>;
  if (!response.ok || !body.success) throw new Error(body.success ? "Unable to upload company logo." : body.error.message);
  return body.data;
}

export async function fetchCompanyLogo(variant: CompanyLogoVariant) {
  const response = await fetch(`${platformApiUrl}/tenant/media/company-logo/${variant}`, { headers: requestHeaders() });
  if (!response.ok) return null;
  return URL.createObjectURL(await response.blob());
}

function requestHeaders() {
  const token = getToken("tenant");
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function isSvg(file: File) {
  return file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read the SVG file."));
    reader.onload = () => {
      const value = String(reader.result ?? "");
      resolve(value.includes(",") ? value.split(",").pop() ?? "" : value);
    };
    reader.readAsDataURL(file);
  });
}
