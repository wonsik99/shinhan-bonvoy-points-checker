// The user approved this dependency-only local patch on 2026-10-12.
// Preserve the immutable hotel approval records and allow only these exact
// package bytes to supersede their earlier dependency hashes.
export const approvedFrameworkDependencyChanges = [
  {
    path: "package.json",
    beforeSha256: "221657cf788f34728a2d8f5986f9a69d6273c7efec8235301c45d52e07f6eafa",
    afterSha256: "56a0dc2e0d6b59cb76169c6ebf70f5cbb05a42b2d56df6c6b44cf12b7e6eecd3",
  },
  {
    path: "package-lock.json",
    beforeSha256: "dc0b9472b210342bc6b2ffdd3a6a261b50ab994e82bb83b7db2eec44e2b96d4c",
    afterSha256: "3f620795056bd0faa66fdab09184f8894e552737b95323b2a6686d51d0e82e2c",
  },
] as const;
