const brandName = "Ecommerce";

export const ecommerceFallbackProfile = {
  brandName,
  fallback: brandName
    .split(/\s+/u)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
  purpose: "Operate a configurable multi-vendor marketplace for public customers.",
  tagline: "multi-vendor marketplace · public commerce"
} as const;
