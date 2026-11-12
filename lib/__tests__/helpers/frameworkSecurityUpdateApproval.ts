// Explicit user approval on 2026-11-07, confirmed on 2026-11-12: update
// Next.js and eslint-config-next from 16.3.8 to 16.4.3 for GHSA-2464-fhr4-w9xw,
// GHSA-673q-mjm6-r5xr and GHSA-p3m5-59mp-jv5r (all patched in 16.4.1).
// Earlier approval records stay frozen. This allows only the reviewed package
// bytes below; no hotel registration, hold, snapshot or collector change.
export const approvedFrameworkSecurityUpdateChanges = [
  {
    path: "package.json",
    beforeSha256: "56a0dc2e0d6b59cb76169c6ebf70f5cbb05a42b2d56df6c6b44cf12b7e6eecd3",
    afterSha256: "50858455ba0684393f52ec76689e924a57da84772562d8f8f1e9b1412f81ae47",
  },
  {
    path: "package-lock.json",
    beforeSha256: "3f620795056bd0faa66fdab09184f8894e552737b95323b2a6686d51d0e82e2c",
    afterSha256: "ed3138afbd3f2317b45e954c6505178b9aeba73c74d4b3e139e37e0d44b9dc9c",
  },
] as const;
