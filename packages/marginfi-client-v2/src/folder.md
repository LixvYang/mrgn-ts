# marginfi-client-v2 source

## Overview

Implements the Marginfi client, v0.1.10 instruction and account boundaries, domain models, services, and protocol integrations.

| Entry | Responsibility |
| --- | --- |
| `anchor-runtime.ts` | Localized Anchor type-erasure boundary for the large v0.1.10 generated IDL. |
| `clients/` | Configured Marginfi and Arena clients. |
| `config.ts` | Runtime client configuration helpers. |
| `configs.json` | Bundled environment and deployment configuration. |
| `constants.ts` | Shared program constants. |
| `errors.ts` | Transaction and program error handling. |
| `idl/` | Versioned Anchor IDLs and active schema selector. |
| `index.ts` | Public package export surface. |
| `instructions.ts` | v0.1.10 instruction builders. |
| `models/` | Bank, group, balance, and account domain models. |
| `services/` | Account, bank, oracle, transaction, and integration services. |
| `types.ts` | Shared package-level types. |
| `utils.ts` | Shared derivation and conversion helpers. |
| `vendor/` | Vendored protocol and SPL helpers. |

Update this file when direct entries in this folder are added, removed, or repurposed.
