import propertyCodeOverrides from "@/data/marriott/property-code-overrides.json";
import type {
  MarriottProperty,
  MarriottPropertySeed,
} from "./marriottProperties/types";

const PROPERTY_CODE_PATTERN = /^[A-Z0-9]{4,8}$/;
const PREFIXED_PROPERTY_COUNTRIES = new Set([
  "AU",
  "CN",
  "ID",
  "IN",
  "JP",
  "MY",
  "PH",
  "SG",
  "TH",
  "TW",
  "US",
  "VN",
]);

const overrides: Readonly<Record<string, string>> = propertyCodeOverrides;

export function resolveMarriottPropertyCode(
  property: MarriottPropertySeed
): string {
  if (property.propertyCode) {
    const code = property.propertyCode.toUpperCase();
    if (PROPERTY_CODE_PATTERN.test(code)) {
      return code;
    }
  }

  if (PROPERTY_CODE_PATTERN.test(property.id)) {
    return property.id;
  }

  if (PREFIXED_PROPERTY_COUNTRIES.has(property.country)) {
    const prefix = `${property.country.toLowerCase()}-`;
    const candidate = property.id.startsWith(prefix)
      ? property.id.slice(prefix.length).toUpperCase()
      : "";
    if (PROPERTY_CODE_PATTERN.test(candidate)) {
      return candidate;
    }
  }

  const override = overrides[property.id];
  if (override && PROPERTY_CODE_PATTERN.test(override)) {
    return override;
  }

  throw new Error(
    `Marriott property code is missing or invalid: ${property.id}`
  );
}

export function attachMarriottPropertyCodes(
  properties: MarriottPropertySeed[]
): MarriottProperty[] {
  const seenCodes = new Map<string, string>();

  return properties.map((property) => {
    const propertyCode = resolveMarriottPropertyCode(property);
    const formerPropertyCodes = (property.formerPropertyCodes ?? []).map(
      (code) => code.toUpperCase()
    );
    for (const code of [propertyCode, ...formerPropertyCodes]) {
      if (!PROPERTY_CODE_PATTERN.test(code)) {
        throw new Error(
          `Marriott property code is missing or invalid: ${property.id} (${code})`
        );
      }
      if (code === propertyCode && formerPropertyCodes.includes(code)) {
        throw new Error(
          `Current Marriott property code is also listed as former: ${property.id} (${code})`
        );
      }
      const existingId = seenCodes.get(code);
      if (existingId) {
        throw new Error(
          `Duplicate Marriott property code ${code}: ${existingId}, ${property.id}`
        );
      }
      seenCodes.set(code, property.id);
    }

    return { ...property, propertyCode, formerPropertyCodes };
  });
}
