// Bvlgari Hotels site redesign (seen in the 2026-11-09 scheduled run): adapt
// the read-only weekly monitor to the new en-US routes and read each page's own
// hotel code. Prepared on 2026-11-17 and recorded here for the owner's explicit
// approval before commit. Earlier approval records stay frozen. This allows
// only the monitor bytes below; no hotel registration, hold, snapshot, CI
// workflow, app code or upload-privacy change.
export const approvedBvlgariMonitorChanges = [
  {
    path: "scripts/marriott/monitor.mjs",
    beforeSha256: "d44f192f9f375d283925e6887b1d23bbecbec193ae3b0338bd61743caddf94d2",
    afterSha256: "122ad1bb982ba4a90df290f34102695151928adbb9aec23468acb3aee7581c2d",
  },
] as const;
