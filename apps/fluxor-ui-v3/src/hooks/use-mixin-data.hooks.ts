import { useComputerStore } from "@mrgnlabs/fluxor-state";
import { useEffect } from "react";
import { initializeMixinVars } from "@mrgnlabs/mrgn-state";
import { PublicKey } from "@solana/web3.js";

const useMixinData = () => {
  const { connected, register, publicKey, balanceAddressMap } = useComputerStore((s) => ({
    connected: s.connected,
    register: s.register,
    publicKey: s.publicKey,
    balanceAddressMap: s.balanceAddressMap,
  }));

  useEffect(() => {
    if (connected && register && publicKey && balanceAddressMap) {
      initializeMixinVars({
        isMixin: true,
        balanceAddressMap,
        publicKey: new PublicKey(publicKey || PublicKey.default),
        connected,
        register,
      });
    }

    const id = window.setInterval(() => {
      initializeMixinVars({
        isMixin: true,
        balanceAddressMap,
        publicKey: new PublicKey(publicKey || PublicKey.default),
        connected,
        register,
      });
    }, 30 * 1000);
    return () => window.clearInterval(id);
  }, [connected, register, publicKey, balanceAddressMap]);

  return;
};

export { useMixinData };
