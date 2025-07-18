import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { MarginfiAccountType } from "@mrgnlabs/marginfi-client-v2";
import { WalletToken } from "@mrgnlabs/mrgn-common";
import {
  fetchMarginfiAccount,
  fetchMarginfiAccountAddresses,
  fetchUserBalances,
  fetchWalletTokens,
} from "../../api/user-api";
import { useRawBanks, useMetadata, useOracleData, useMintData } from ".";
import { TokenAccount } from "../../types";
import { useWalletAddress } from "../../context/wallet-state.context";
import { useSelectedAccount } from "../../context/selected-account.context";
import { getConfig, getMixinVars } from "../../config";

export function useMarginfiAccountAddresses() {
  const authority = useWalletAddress();
  // console.log("🔄 useMarginfiAccountAddresses authority: ", authority && authority?.toBase58());

  return useQuery<PublicKey[], Error>({
    queryKey: ["marginfiAccountAddresses", authority?.toBase58() ?? null],
    queryFn: () => {
      if (!authority) {
        throw new Error("Authority is required to fetch account addresses");
      }
      return fetchMarginfiAccountAddresses(authority);
    },
    enabled: Boolean(authority),
    staleTime: 10 * 60_000, // 10 minutes
    retry: 1,
  });
}

export type UseMarginfiAccountOpts = {
  overrideAccount?: PublicKey;
};

export function useMarginfiAccount(opts?: UseMarginfiAccountOpts) {
  let authority = useWalletAddress();
  if (getConfig().isMixin) {
    authority = getMixinVars().publicKey;
  }

  // console.log("🔄 useMarginfiAccount authority: ", authority && authority?.toBase58());

  const { data: rawBanks, isSuccess: isSuccessRawBanks, isError: isErrorRawBanks } = useRawBanks();
  const { data: metadata, isSuccess: isSuccessMetadata, isError: isErrorMetadata } = useMetadata();
  const { data: oracleData, isSuccess: isSuccessOracleData, isError: isErrorOracleData } = useOracleData();

  const { selectedAccountKey } = useSelectedAccount();

  // Debug logging for selectedAccountKey changes
  // Check if any of the dependencies have errors
  const hasErrors = isErrorRawBanks || isErrorMetadata || isErrorOracleData;

  // Check if all required data is available
  const allDataReady = isSuccessMetadata && isSuccessOracleData && isSuccessRawBanks;

  const queryEnabled = allDataReady && !hasErrors && Boolean(selectedAccountKey);

  return useQuery<MarginfiAccountType | null, Error>({
    queryKey: ["marginfiAccount", authority?.toBase58() ?? null, selectedAccountKey ?? null],
    queryFn: async () => {
      if (!rawBanks || !oracleData?.pythFeedIdMap || !oracleData?.oracleMap || !metadata?.bankMetadataMap) {
        throw new Error("Required data not available for fetching MarginFi account");
      }

      const result = await fetchMarginfiAccount(
        rawBanks,
        oracleData.pythFeedIdMap,
        oracleData.oracleMap,
        metadata.bankMetadataMap,
        authority ? new PublicKey(authority) : undefined,
        selectedAccountKey ? new PublicKey(selectedAccountKey) : undefined
      );

      return result;
    },
    enabled: queryEnabled,
    staleTime: 2 * 60_000, // 2 minutes
    // refetchInterval: 60_000, // Temporarily disabled for performance
    retry: (failureCount, error) => {
      console.log("🔄 useMarginfiAccount retry attempt:", failureCount, "error:", error.message);
      // Don't retry if we have dependency errors
      if (hasErrors) return false;
      // Only retry up to 2 times for other errors
      return failureCount < 2;
    },
  });
}

export function useUserBalances() {
  const authority = useWalletAddress();
  const { data: mintData, isSuccess: isSuccesMintData, isError: isErrorMintData } = useMintData();

  return useQuery<{ nativeSolBalance: number; ataList: TokenAccount[] }, Error>({
    queryKey: ["userBalance", authority?.toBase58() ?? null],
    queryFn: async () => {
      if (!mintData) {
        throw new Error("Required data not available for fetching user balances");
      }
      return await fetchUserBalances(mintData, authority);
    },
    enabled: isSuccesMintData && !isErrorMintData,
    refetchInterval: 0.5 * 1000, // 0.5 second
    // staleTime: 2 * 60_000, // 2 minutes
    // refetchInterval: 60_000, // Temporarily disabled for performance
    retry: (failureCount, error) => {
      // Don't retry if we have dependency errors
      if (isErrorMintData) return false;
      // Only retry up to 2 times for other errors
      return failureCount < 2;
    },
  });
}

export function useWalletTokens() {
  const authority = useWalletAddress();
  const { data: rawBanks, isSuccess: isSuccessRawBanks, isError: isErrorRawBanks } = useRawBanks();
  const { data: metadata, isSuccess: isSuccessMetadata, isError: isErrorMetadata } = useMetadata();

  // Check if dependencies have errors
  const hasErrors = isErrorRawBanks || isErrorMetadata;

  // Check if all required data is available
  const allDataReady = isSuccessRawBanks && isSuccessMetadata && Boolean(authority);

  return useQuery<WalletToken[], Error>({
    queryKey: ["walletTokens", authority?.toBase58() ?? null],
    queryFn: async () => {
      if (!rawBanks || !metadata?.bankMetadataMap || !authority) {
        throw new Error("Required data not available for fetching wallet tokens");
      }

      // Create sets for filtering bank tokens
      const bankTokenSymbols = new Set(
        rawBanks.map((bank) => metadata.bankMetadataMap[bank.address.toBase58()]?.tokenSymbol).filter(Boolean)
      );
      const bankTokenAddresses = new Set(rawBanks.map((bank) => bank.address.toBase58()));

      return await fetchWalletTokens(authority, bankTokenSymbols, bankTokenAddresses);
    },
    enabled: allDataReady && !hasErrors,
    staleTime: 2 * 60_000, // 2 minutes
    // refetchInterval: 60_000, // Temporarily disabled for performance
    retry: (failureCount, error) => {
      // Don't retry if we have dependency errors
      if (hasErrors) return false;
      // Only retry up to 2 times for other errors
      return failureCount < 2;
    },
  });
}
