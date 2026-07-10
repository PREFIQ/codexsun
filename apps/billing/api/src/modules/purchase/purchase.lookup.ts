import { env } from "../../env.js";

const lookupPaths = {
  addressTypes: "/core/common/contacts/address-types",
  colours: "/core/common/products/colours",
  contacts: "/core/master/contacts",
  countries: "/core/common/location/countries",
  states: "/core/common/location/states",
  districts: "/core/common/location/districts",
  cities: "/core/common/location/cities",
  pincodes: "/core/common/location/pincodes",
  products: "/core/master/products",
  productCategories: "/core/common/products/product-categories",
  hsnCodes: "/core/common/products/hsn-codes",
  units: "/core/common/products/units",
  taxes: "/core/common/products/taxes",
  sizes: "/core/common/products/sizes",
  workOrders: "/core/master/work-orders",
} as const;

export type PurchaseLookupKind = keyof typeof lookupPaths;
export type PurchaseLocationKind = "cities" | "districts" | "pincodes" | "states";

export class PurchaseLookupService {
  async list(kind: PurchaseLookupKind, headers: LookupHeaders) {
    const response = await this.request(lookupPaths[kind], headers);
    return responseData(response);
  }

  create(kind: PurchaseLookupKind, headers: LookupHeaders, input: Record<string, unknown>) {
    return this.request(lookupPaths[kind], headers, { body: JSON.stringify(input), method: "POST" }).then(responseData);
  }

  update(kind: "contacts" | "products" | "workOrders", headers: LookupHeaders, id: string, input: Record<string, unknown>) {
    return this.request(`${lookupPaths[kind]}/${encodeURIComponent(id)}`, headers, { body: JSON.stringify(input), method: "PUT" }).then(responseData);
  }

  private request(path: string, headers: LookupHeaders, init?: RequestInit) {
    return fetch(`${env.CORE_API_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(headerValue(headers.authorization) ? { Authorization: headerValue(headers.authorization)! } : {}),
        ...(headerValue(headers.tenantId) ? { "x-tenant-id": headerValue(headers.tenantId)! } : {}),
      },
    });
  }
}

type LookupHeaders = { authorization?: string | string[]; tenantId?: string | string[] };

async function responseData(response: Response) {
  const payload = await response.json() as { data?: unknown; error?: { message?: string }; success?: boolean };
  if (!response.ok || payload.success === false) throw new Error(payload.error?.message || "Purchases lookup could not be loaded.");
  return payload.data ?? [];
}

export function isPurchaseLookupKind(value: string): value is PurchaseLookupKind {
  return value in lookupPaths;
}

function headerValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
