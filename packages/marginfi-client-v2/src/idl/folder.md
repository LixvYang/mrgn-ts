# Marginfi IDL module

## Overview

Bundles versioned Anchor IDLs and selects the schema used by `marginfi-client-v2` for instruction encoding and account decoding. Historical IDLs remain available for compatibility and comparison.

## Files

| File | Role | Function |
|------|------|----------|
| `index.ts` | Selector | Exports the active v0.1.10 runtime IDL and generated TypeScript type. |
| `idl.utils.ts` | Utility | Returns the bundled active IDL to SDK callers. |
| `marginfi_0.1.7.json` | Historical schema | Preserves the marginfi v0.1.7 Anchor IDL. |
| `marginfi-types_0.1.7.ts` | Historical types | Preserves the generated TypeScript type for v0.1.7. |
| `marginfi_0.1.10.json` | Active schema | Contains the official marginfi v0.1.10 Anchor IDL. |
| `marginfi-types_0.1.10.ts` | Active types | Contains the official generated TypeScript type for v0.1.10. |

---
**SYNC ALERT**: If this folder changes, update this file.
