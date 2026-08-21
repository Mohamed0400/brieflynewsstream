import { COUNTRY_CATALOG } from "./countries";

const COUNTRY_CODES = new Set(COUNTRY_CATALOG.map((item) => item.code));

export type SignupProfile = {
  country: string;
  address: string;
  mobilePhone: string;
};

export function normalizeSignupProfile(input: {
  country?: string;
  address?: string;
  mobilePhone?: string;
}): { profile?: SignupProfile; error?: string } {
  const country = (input.country || "").trim().toUpperCase();
  const address = (input.address || "").replace(/\s+/g, " ").trim();
  const mobilePhone = (input.mobilePhone || "").replace(/\s+/g, " ").trim();

  if (!COUNTRY_CODES.has(country)) {
    return { error: "Choose a country from the list." };
  }
  if (address.length < 8 || address.length > 200) {
    return { error: "Enter a full address between 8 and 200 characters." };
  }
  if (!/^\+?[0-9][0-9\s\-()]{7,19}$/.test(mobilePhone)) {
    return { error: "Enter a valid mobile number with country code." };
  }

  return {
    profile: {
      country,
      address,
      mobilePhone: mobilePhone.replace(/[^\d+]/g, ""),
    },
  };
}

export function profileFromAuthMetadata(metadata: Record<string, unknown> | undefined): Partial<SignupProfile> {
  if (!metadata) return {};
  const country = typeof metadata.country === "string" ? metadata.country.trim().toUpperCase() : "";
  const address = typeof metadata.address === "string" ? metadata.address.trim() : "";
  const mobilePhone = typeof metadata.mobilePhone === "string"
    ? metadata.mobilePhone.trim()
    : typeof metadata.mobile === "string" ? metadata.mobile.trim() : "";
  return {
    ...(country ? { country } : {}),
    ...(address ? { address } : {}),
    ...(mobilePhone ? { mobilePhone } : {}),
  };
}
