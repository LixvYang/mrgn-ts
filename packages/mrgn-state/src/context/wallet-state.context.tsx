import React, { createContext, useContext, useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { Wallet } from "@mrgnlabs/mrgn-common";

interface WalletContextState {
  walletAddress: PublicKey | undefined;
  wallet: Wallet;
}

const WalletContext = createContext<WalletContextState | undefined>(undefined);

/**
 * Wallet context provider for mrgn-state package.
 * This provides wallet address state that can be consumed by all React Query hooks
 * without creating circular dependencies with mrgn-ui.
 */
export function WalletStateProvider({
  children,
  walletAddress: externalWalletAddress,
  wallet: externalWallet,
}: {
  children: React.ReactNode;
  walletAddress?: PublicKey;
  wallet?: Wallet;
}) {
  const [walletAddress, setWalletAddress] = useState<PublicKey | undefined>(externalWalletAddress);
  const [wallet, setWallet] = useState<Wallet | undefined>(externalWallet);
  // Sync external wallet address changes
  useEffect(() => {
    setWalletAddress(externalWalletAddress);
    setWallet(externalWallet);
  }, [externalWalletAddress, externalWallet]);

  // useEffect(() => {
  //   if (!walletAddress) return;
  //   const id = window.setInterval(() => {
  //     console.log("walletAddress", walletAddress);
  //   }, 1 * 1000);
  //   return () => window.clearInterval(id);
  // }, [walletAddress]);

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        wallet: wallet ?? ({ publicKey: PublicKey.default } as Wallet),
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

/**
 * Hook to get the current wallet address from mrgn-state internal context.
 * Used by React Query hooks to automatically get wallet address without prop drilling.
 */
export function useWalletAddress(): PublicKey | undefined {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletAddress must be used within a WalletStateProvider");
  }
  return context.walletAddress;
}

export function useWalletState(): WalletContextState {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletState must be used within a WalletStateProvider");
  }
  return context;
}
