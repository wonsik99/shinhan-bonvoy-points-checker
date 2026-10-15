// Preserve immutable hotel approval records and each earlier alias revision.
// The user approved the Hanoi candidate on 2026-10-14, then added the Osaka
// alias and requested local review/commit preparation on 2026-10-15.
// The Boston Seaport review-only candidate was approved for local preparation
// on 2026-10-15; its merchant-to-hotel connection remains unconfirmed.
// This ordered chain permits only the recorded alias blocks; no registration,
// hold, snapshot, or automatic commit is authorized by these test records.
export const approvedMerchantAliasChanges = [
  {
    path: "rules/marriottPropertyOverrides.ts",
    propertyId: "vn-hansw",
    alias: "CN CT THQ TTKS - FO",
    beforeSha256: "6ee65bf0aeb1a3e4928815638682472fe7bb8cd636c1d5e3f2e93a35a3e648dc",
    afterSha256: "d084a34e926ab71c4ed16badb076252ed796e700219129d71bc0489cb4653a5f",
    addedBlockPattern: /  \/\/ Reviewed 2026-10-14: VIB[^]*?(?=  \/\/ Vinpearl also operates)/,
  },
  {
    path: "rules/marriottPropertyOverrides.ts",
    propertyId: "jp-osays",
    alias: "MIYAKO HOTELSSHERATON OSK",
    beforeSha256: "d084a34e926ab71c4ed16badb076252ed796e700219129d71bc0489cb4653a5f",
    afterSha256: "45899036f1190b07044d53ac4c11decf1b800f2d683eeea40ed934ac3f18972c",
    addedBlockPattern: /  \/\/ Reviewed 2026-10-15: user-reported Miyako[^]*?(?=  \/\/ Verified Malaysian)/,
  },
  {
    path: "rules/marriottPropertyOverrides.ts",
    propertyId: "us-boswf",
    alias: "RH SEAPORT DISTRICT",
    beforeSha256: "45899036f1190b07044d53ac4c11decf1b800f2d683eeea40ed934ac3f18972c",
    afterSha256: "860407dc95c9e795c42b7e73aa09ac02f6496698a06c483445d2c31b66219b5d",
    addedBlockPattern: /  \/\/ Reviewed 2026-10-15: RH SEAPORT DISTRICT[^]*?(?=  \/\/ Reviewed 2026-10-14: VIB)/,
  },
] as const;
