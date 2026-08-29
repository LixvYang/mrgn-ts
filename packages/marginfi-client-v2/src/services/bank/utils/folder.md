# Bank serialization utilities

## Overview

Converts SDK bank models and configuration values to and from Anchor-compatible raw representations and DTOs.

## Files

| File | Role | Function |
|------|------|----------|
| `deserialize.utils.ts` | Deserializer | Converts raw bank account data into SDK bank models. |
| `fetch.utils.ts` | RPC utility | Fetches and types decoded v0.1.10 bank accounts. |
| `serialize.utils.ts` | Serializer | Converts SDK bank models and configuration options into on-chain representations. |
| `serialize.utils.test.ts` | Test | Covers v0.1.10 bank configuration serialization compatibility. |

---
**SYNC ALERT**: If this folder changes, update this file.
