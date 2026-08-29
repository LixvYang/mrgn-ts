# Marginfi account models

## Overview

Implements account-domain behavior, transaction construction, mixin support, and client-bound wrappers.

## Files

| File | Role | Function |
|------|------|----------|
| `pure.ts` | Domain model | Implements account state, health calculations, and transaction instruction construction. |
| `wrapper.ts` | Client wrapper | Binds account operations to a configured Marginfi client. |
| `mixin.ts` | Integration helper | Adapts account instructions for mixin-compatible flows. |
| `index.ts` | Export surface | Re-exports account model APIs. |

---
**SYNC ALERT**: If this folder changes, update this file.
