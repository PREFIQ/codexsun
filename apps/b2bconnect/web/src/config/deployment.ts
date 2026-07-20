const brandName = "B2B Connect";

export const b2bConnectFallbackProfile = {
  brandName,
  fallback: brandName
    .split(/\s+/u)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
  purpose: "Connect verified business buyers and sellers through a trusted B2B marketplace.",
  tagline: "business buyers · sellers · opportunities"
} as const;
