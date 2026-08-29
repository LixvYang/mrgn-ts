/**
 * INPUT: Strongly typed MarginfiProgram instances and generated Anchor namespace names
 * OUTPUT: Locally erased method and account clients with typed account payload boundaries
 * POSITION: Internal compatibility boundary for Anchor 0.30.1 with the large marginfi v0.1.10 IDL
 *
 * SYNC: If this file changes, update this header and ./folder.md
 */
import { Address } from "@coral-xyz/anchor";
import { AccountInfo, Commitment, PublicKey } from "@solana/web3.js";

import { MarginfiProgram } from "./types";

export type MarginfiRuntimeMethods = Record<string, (...args: any[]) => any>;

export interface MarginfiRuntimeAccountClient<T> {
  fetch(address: Address, commitment?: Commitment): Promise<T>;
  fetchMultiple(addresses: Address[]): Promise<(T | null)[]>;
  all(filters?: unknown[]): Promise<{ publicKey: PublicKey; account: T }[]>;
  getAccountInfo(address: Address): Promise<AccountInfo<Buffer> | null>;
}

export function getMarginfiRuntimeMethods(program: MarginfiProgram): MarginfiRuntimeMethods {
  return (program as any).methods;
}

export function getMarginfiRuntimeAccountClient<T>(
  program: MarginfiProgram,
  accountName: string
): MarginfiRuntimeAccountClient<T> {
  return (program as any).account[accountName];
}
