// Explicit user approval on 2026-10-17: implement The Classic card (C1–C4)
// support from the approved plan, verify, and prepare local commits. Earlier
// approval records stay frozen. This allows only the reviewed runtime bytes
// below; no hotel registration, hold, snapshot or collector change.
export const approvedClassicCardChanges = [
  {
    path: "lib/analyzeTransactions.ts",
    beforeSha256: "92f30f9731f1a4d04b5045f7447d12f0a52348f9fb401a4be5ec977c054b1c22",
    afterSha256: "98994fc77d4aad9fe5458e56bd5a50de13d2ba3d779a347ec7fcdf068dcabf6d",
  },
  {
    path: "lib/normalizeTransaction.ts",
    beforeSha256: "c6532b4b311c67b13e3351677539926eab1f8a16d2ac2366e4b10f6ef195ec10",
    afterSha256: "253e29f87f666d70e4c755683a8c40e1f0ce0fef3107651fa9979e394398847f",
  },
  {
    path: "lib/inquiryMessage.ts",
    beforeSha256: "e4e3e47e236a6bff9875d01d27d485fa0748379390b329d69616c95136e7ffc5",
    afterSha256: "910a71f9b32e8cffbcfabd55fd9f7375821ed20c0f15813842dff7284c8b7789",
  },
  {
    path: "lib/feedback.ts",
    beforeSha256: "31eaf08661df53e6a1aa483ea3d1e92f475c7a9ebd3a2b1f83035daacd43dfa2",
    afterSha256: "9077ab10c7dd66901f57ea2cf6732317847b8bba27976a31f9b4713c0ad9eaee",
  },
  {
    path: "app/page.tsx",
    beforeSha256: "9c6e93bef345f56db32b1b24d017ff0f9e799a518c260887828110c34a0443f2",
    afterSha256: "95c8826fb1aaab3ebad2a93bf02e85e9ac0e3c70d22c242951e63ab3b0bbf444",
  },
] as const;
