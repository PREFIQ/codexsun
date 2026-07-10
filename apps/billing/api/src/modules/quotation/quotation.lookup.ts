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

export type QuotationLookupKind = keyof typeof lookupPaths;
export type QuotationLocationKind = "cities" | "districts" | "pincodes" | "states";

export class QuotationLookupService {
  async list(kind: QuotationLookupKind, headers: { authorization?: string | string[]; tenantId?: string | string[] }) {
    const response = await this.request(lookupPaths[kind], headers);
    const payload = await response.json() as { data?: unknown; error?: { message?: string }; success?: boolean };
    if (!response.ok || payload.success === false) throw new Error(payload.error?.message || "Quotation lookup could not be loaded.");
    return payload.data ?? [];
  }

  async createContact(headers: { authorization?: string | string[]; tenantId?: string | string[] }, input: Record<string, unknown>) {
    const response = await this.request(lookupPaths.contacts, headers, { body: JSON.stringify(input), method: "POST" });
    return responseData(response);
  }

  async updateContact(headers: { authorization?: string | string[]; tenantId?: string | string[] }, id: string, input: Record<string, unknown>) {
    const response = await this.request(`${lookupPaths.contacts}/${encodeURIComponent(id)}`, headers, { body: JSON.stringify(input), method: "PUT" });
    return responseData(response);
  }

  async createLocation(kind: QuotationLocationKind, headers: { authorization?: string | string[]; tenantId?: string | string[] }, input: Record<string, unknown>) {
    const response = await this.request(lookupPaths[kind], headers, { body: JSON.stringify(input), method: "POST" });
    return responseData(response);
  }

  async createAddressType(headers: { authorization?: string | string[]; tenantId?: string | string[] }, input: Record<string, unknown>) {
    const response = await this.request(lookupPaths.addressTypes, headers, { body: JSON.stringify(input), method: "POST" });
    return responseData(response);
  }

  async createLookup(kind: "colours" | "products" | "sizes" | "workOrders" | "productCategories" | "hsnCodes" | "units" | "taxes", headers: { authorization?: string | string[]; tenantId?: string | string[] }, input: Record<string, unknown>) {
    const response = await this.request(lookupPaths[kind], headers, { body: JSON.stringify(input), method: "POST" });
    return responseData(response);
  }

  async updateLookup(kind: "products" | "workOrders", headers: { authorization?: string | string[]; tenantId?: string | string[] }, id: string, input: Record<string, unknown>) {
    const response = await this.request(`${lookupPaths[kind]}/${encodeURIComponent(id)}`, headers, { body: JSON.stringify(input), method: "PUT" });
    return responseData(response);
  }

  private request(path: string, headers: { authorization?: string | string[]; tenantId?: string | string[] }, init?: RequestInit) {
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

async function responseData(response: Response) {
    const payload = await response.json() as { data?: unknown; error?: { message?: string }; success?: boolean };
    if (!response.ok || payload.success === false) throw new Error(payload.error?.message || "Quotation lookup could not be loaded.");
    return payload.data ?? [];
}

export function isQuotationLookupKind(value: string): value is QuotationLookupKind {
  return value in lookupPaths;
}

function headerValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
