# Account Utilities

Helpers for deserializing margin accounts, calculating health and e-mode values, fetching accounts, and serializing account data.

| File | Responsibility |
| --- | --- |
| `compute.utils.ts` | Computes account health, projected balances, and ordered risk remaining accounts. |
| `compute.utils.test.ts` | Covers v0.1.10 risk remaining-account ordering. |
| `deserialize.utils.ts` | Converts raw margin account data into client models. |
| `emode.utils.ts` | Computes e-mode impacts and eligibility. |
| `fetch.utils.ts` | Fetches margin accounts through the Anchor runtime boundary. |
| `index.ts` | Re-exports account utility APIs. |
| `serialize.utils.ts` | Serializes account models for transport and persistence. |

Update this file when files in this folder are added, removed, or repurposed.
