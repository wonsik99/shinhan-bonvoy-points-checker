// Explicit user approval on 2026-10-16: exclude the confirmed points-purchase
// descriptor from hotel accrual calculations, verify, and commit locally.
// Keep all earlier hotel approval records immutable. This allows only the
// reviewed runtime bytes below; no hotel registration or snapshot is changed.
export const approvedPointsPurchaseChanges = [
  {
    path: "lib/classifyMerchant.ts",
    beforeSha256: "a7005223bf0994174a1ec4c911236ef5370355ef4bc07b821ad837e5cc7ad415",
    afterSha256: "6c0de26df924ee66cb4351e1fbc24ef006d9a91d8d7969e1160613f6ad48e1d2",
  },
  {
    path: "lib/analyzeTransactions.ts",
    beforeSha256: "a29c23361ceaead720485ade03dc190c0a1e46295cea5cf1d0512fea1d4c9e19",
    afterSha256: "92f30f9731f1a4d04b5045f7447d12f0a52348f9fb401a4be5ec977c054b1c22",
  },
  {
    path: "lib/feedback.ts",
    beforeSha256: "a07880e7ed46cd2d90161cd3797052db9c908207f0d9208dfb660cf30a298ff3",
    afterSha256: "31eaf08661df53e6a1aa483ea3d1e92f475c7a9ebd3a2b1f83035daacd43dfa2",
  },
] as const;
