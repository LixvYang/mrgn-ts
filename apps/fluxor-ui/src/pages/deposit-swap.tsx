import React from "react";

import { ActionBox } from "@mrgnlabs/mrgn-ui";
import { capture } from "@mrgnlabs/mrgn-utils";
import { useConnection } from "~/hooks/use-connection";

import { useAppStore, useMrgnlendStore } from "~/store";

import { PageHeading } from "~/components/common/PageHeading";
import { Loader } from "~/components/ui/loader";
import { WalletToken } from "@mrgnlabs/mrgn-common";

export default function DepositSwapPage() {
  const [connected, publicKey, getUserMix, computerInfo, computerAccount, getComputerRecipient, balanceAddressMap] =
    useAppStore((state) => [
      state.connected,
      state.publicKey,
      state.getUserMix,
      state.info,
      state.account,
      state.getComputerRecipient,
      state.balanceAddressMap,
    ]);

  const [
    walletTokens,
    initialized,
    extendedBankInfosWithoutStakedAssets,
    fetchWalletTokens,
    fetchMixinWalletTokens,
    extendedBankInfos,
    marginfiClient,
    updateWalletTokens,
    updateWalletToken,
    fetchMrgnlendState,
  ] = useMrgnlendStore((state) => [
    state.walletTokens,
    state.initialized,
    state.extendedBankInfosWithoutStakedAssets,
    state.fetchWalletTokens,
    state.fetchMixinWalletTokens,
    state.extendedBankInfos,
    state.marginfiClient,
    state.updateWalletTokens,
    state.updateWalletToken,
    state.fetchMrgnlendState,
  ]);
  const { connection } = useConnection();
  const intervalId = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    if (!publicKey) {
      return;
    }
    if (
      // wallet &&
      extendedBankInfos &&
      extendedBankInfos.length > 0 &&
      (walletTokens === null || walletTokens.length === 0)
    ) {
      fetchMixinWalletTokens(publicKey, extendedBankInfos);
    }
  }, [fetchMixinWalletTokens, extendedBankInfos, publicKey, walletTokens]);

  const fetchAndUpdateTokens = React.useCallback(() => {
    if (!connection) {
      return;
    }

    if (connection) {
      console.log("🔄 Periodically fetching wallet tokens");
      updateWalletTokens(connection);
    }
  }, [connection, updateWalletTokens]);

  // Effect for periodic updates
  React.useEffect(() => {
    intervalId.current = setInterval(fetchAndUpdateTokens, 60_000); // Periodic refresh

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {!initialized && <Loader label="Loading deposit swap..." className="mt-16" />}

      {initialized && (
        <div className="w-full max-w-7xl mx-auto mb-20 px-5">
          <PageHeading heading="Deposit Swap" body={<p>Swap any token and deposit in your chosen collateral.</p>} />
          <div className="flex flex-col items-center justify-center p-8 mt-8 rounded-lg">
            <h3 className="text-2xl font-semibold mb-4">🚧 Coming Soon</h3>
            <p className="text-center">We&apos;re working hard to bring this feature to you. Stay tuned!</p>
          </div>

          {/* <ActionBox.DepositSwap
            useProvider={true}
            depositSwapProps={{
              banks: extendedBankInfosWithoutStakedAssets,
              allBanks: extendedBankInfos,
              connected: connected,
              requestedDepositBank: undefined,
              requestedSwapBank: undefined,
              walletTokens: walletTokens,
              captureEvent: (event, properties) => {
                capture(event, properties);
              },
              onComplete(infoProps: { walletToken?: WalletToken }) {
                const connection = marginfiClient?.provider.connection;
                if (infoProps.walletToken && connection) {
                  updateWalletToken(
                    infoProps.walletToken.address.toBase58(),
                    infoProps.walletToken.ata.toBase58(),
                    marginfiClient?.provider.connection
                  );
                }
                fetchMrgnlendState();
              },
              isMixin: true,
              getUserMix: getUserMix,
              computerInfo: computerInfo,
              connection: connection,
              computerAccount: computerAccount,
              getComputerRecipient: getComputerRecipient,
              balanceAddressMap: balanceAddressMap,
            }}
          /> */}
        </div>
      )}
    </>
  );
}
