// Explicit user approval on 2026-10-17: implement the narrow hotel-apostrophe
// comparison plan locally and verify it. No commit, push, registration, hold
// release or snapshot update is authorized. Earlier approval records stay frozen.
export const approvedApostropheNormalizationChanges = [
  {
    path: "lib/classifyMerchant.ts",
    beforeSha256: "6c0de26df924ee66cb4351e1fbc24ef006d9a91d8d7969e1160613f6ad48e1d2",
    afterSha256: "2f797afcea5938f8fb90e672ce401f88b7c8b48f24717cafce7c3d9b022218d2",
  },
  {
    path: "rules/marriottProperties/helpers.ts",
    beforeSha256: "e946b90a6aa4fa1e7ef2b3add43355221a639367b87d9b481217223d1b53b3f1",
    afterSha256: "158595bce70e4134258608a40e64b5324323c74874a39678566511d0eadf255b",
  },
] as const;
