import React from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@mrgnlabs/mrgn-ui";
import { useComputerStore } from "@mrgnlabs/fluxor-state";

import { WalletStateProvider, SelectedAccountProvider } from "@mrgnlabs/mrgn-state";

export const AdditionalProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { walletAddress } = useWallet();
  const { connected, register, publicKey: mixinStorePublicKey } = useComputerStore();

  const mixinPublicKey = React.useMemo(() => {
    if (!mixinStorePublicKey) {
      return undefined;
    }

    try {
      return typeof mixinStorePublicKey === "string"
        ? new PublicKey(mixinStorePublicKey)
        : (mixinStorePublicKey as PublicKey);
    } catch (error) {
      console.error("Failed to parse mixin public key", error);
      return undefined;
    }
  }, [mixinStorePublicKey]);

  const effectiveWalletAddress = React.useMemo(() => {
    if (connected && register && mixinPublicKey && !mixinPublicKey.equals(PublicKey.default)) {
      return mixinPublicKey;
    }

    return walletAddress ?? undefined;
  }, [connected, register, mixinPublicKey, walletAddress]);

  return (
    <WalletStateProvider walletAddress={effectiveWalletAddress}>
      <SelectedAccountProvider>{children}</SelectedAccountProvider>
    </WalletStateProvider>
  );
};
