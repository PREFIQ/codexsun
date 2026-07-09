export type LocationKind = "country" | "state" | "district" | "city" | "pincode"
export type LocationStatus = "active" | "inactive"

export type LocationRecord = {
  areaName?: string | null
  capital?: string | null
  cityId?: string | null
  cityName?: string | null
  code: string
  countryId?: string | null
  countryName?: string | null
  currencyCode?: string | null
  dialCode?: string | null
  districtId?: string | null
  districtName?: string | null
  gstStateCode?: string | null
  id: string
  iso2?: string | null
  iso3?: string | null
  name: string
  numericCode?: string | null
  pincode?: string | null
  shortCode?: string | null
  sortOrder: number
  stateId?: string | null
  stateName?: string | null
  status: LocationStatus
  tenantId: string
  uuid: string
}

export type LocationSavePayload = Omit<LocationRecord, "id" | "tenantId" | "uuid">

export type LocationDefinition = {
  columns: Array<{ key: keyof LocationRecord; label: string }>
  kind: LocationKind
  label: string
  path: string
  plural: string
}
