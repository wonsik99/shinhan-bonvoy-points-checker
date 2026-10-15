// The user approved this review-only merchant-alias patch on 2026-10-14.
// Preserve the immutable hotel approval records. Only these exact override
// bytes may supersede their earlier hash; no registration or hold is changed.
export const approvedMerchantAliasChanges = [
  {
    path: "rules/marriottPropertyOverrides.ts",
    propertyId: "vn-hansw",
    alias: "CN CT THQ TTKS - FO",
    beforeSha256: "6ee65bf0aeb1a3e4928815638682472fe7bb8cd636c1d5e3f2e93a35a3e648dc",
    afterSha256: "d084a34e926ab71c4ed16badb076252ed796e700219129d71bc0489cb4653a5f",
  },
] as const;
