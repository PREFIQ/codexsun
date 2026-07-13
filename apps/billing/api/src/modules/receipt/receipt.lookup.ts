import { env } from "../../env.js";

export type ReceiptLookupHeaders = {
  authorization?: string | string[] | undefined;
  tenantDatabase?: string | string[] | undefined;
  tenantId?: string | string[] | undefined;
};

export class ReceiptLookupService {
  contacts(headers: ReceiptLookupHeaders) {
    return this.get("/core/master/contacts", headers);
  }
  ledgers(headers: ReceiptLookupHeaders) {
    return this.get("/core/common/accounts/ledgers", headers);
  }
  private get(path: string, headers: ReceiptLookupHeaders) {
    return fetch(`${env.CORE_API_URL}${path}`, {
      headers: {
        Accept: "application/json",
        ...(headerValue(headers.authorization)
          ? { Authorization: headerValue(headers.authorization)! }
          : {}),
        ...(headerValue(headers.tenantDatabase)
          ? { "x-tenant-db": headerValue(headers.tenantDatabase)! }
          : {}),
        ...(headerValue(headers.tenantId) ? { "x-tenant-id": headerValue(headers.tenantId)! } : {})
      }
    }).then(responseData);
  }
}

async function responseData(response: Response) {
  const payload = (await response.json()) as {
    data?: unknown;
    error?: { message?: string };
    success?: boolean;
  };
  if (!response.ok || payload.success === false)
    throw new Error(payload.error?.message || "Receipt lookup could not be loaded.");
  return payload.data ?? [];
}

function headerValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
