/**
 * INPUT: The bundled marginfi v0.1.10 Anchor IDL JSON and generated TypeScript type
 * OUTPUT: The active MARGINFI_IDL value and MarginfiIdlType used by SDK consumers
 * POSITION: Canonical IDL selector for marginfi-client-v2 runtime encoding and account decoding
 *
 * SYNC: If this file changes, update this header and ./folder.md
 */
import { Marginfi as MarginfiIdlTypeV0_1_10 } from "./marginfi-types_0.1.10";
import MARGINFI_IDL_V0_1_10_JSON from "./marginfi_0.1.10.json";

export const MARGINFI_IDL = MARGINFI_IDL_V0_1_10_JSON as MarginfiIdlType;
export type MarginfiIdlType = MarginfiIdlTypeV0_1_10;
