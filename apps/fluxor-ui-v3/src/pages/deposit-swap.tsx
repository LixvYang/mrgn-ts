import React from "react";

import { ActionBox, useWallet } from "@mrgnlabs/mrgn-ui";
import { capture } from "@mrgnlabs/mrgn-utils";

import { PageHeading } from "~/components/common/PageHeading";
import { Loader } from "~/components/ui/loader";
import { WalletToken } from "@mrgnlabs/mrgn-common";
import { useExtendedBanks, useMarginfiClient, useRefreshUserData, useWalletTokens } from "@mrgnlabs/mrgn-state";
import { useComputerStore } from "@mrgnlabs/fluxor-state";

export default function DepositSwapPage() {
  const { data: walletTokens } = useWalletTokens();
  const { extendedBanks } = useExtendedBanks();
  const { marginfiClient } = useMarginfiClient();
  const refreshUserData = useRefreshUserData();

  const extendedBankInfosWithoutStakedAssets = React.useMemo(
    () => extendedBanks?.filter((bank) => bank.info.rawBank.config.assetTag !== 2),
    [extendedBanks]
  );

  // const { connected } = useWallet();
  const { connected } = useComputerStore();

  return (
    <>
      <PageHeading heading="Deposit Swap" body={<p>交易任何代币并存入您选择的抵押品。</p>} />
      <div className="flex flex-col items-center justify-center p-8 mt-8 rounded-lg">
        <h3 className="text-2xl font-semibold mb-4">🚧 即将推出</h3>
        <p className="text-center">我们正在努力为您带来这个功能。敬请期待！</p>
      </div>

      {/* {!extendedBankInfosWithoutStakedAssets && <Loader label="Loading deposit swap..." className="mt-16" />}

      {extendedBankInfosWithoutStakedAssets && (
        <div className="w-full max-w-7xl mx-auto mb-20 px-5">
          <PageHeading heading="Deposit Swap" body={<p>Swap any token and deposit in your chosen collateral.</p>} />
          <ActionBox.DepositSwap
            useProvider={true}
            depositSwapProps={{
              banks: extendedBankInfosWithoutStakedAssets,
              allBanks: extendedBanks,
              connected: connected,
              requestedDepositBank: undefined,
              requestedSwapBank: undefined,
              walletTokens: walletTokens ?? [],
              captureEvent: (event, properties) => {
                capture(event, properties);
              },
              onComplete(infoProps: { walletToken?: WalletToken }) {
                const connection = marginfiClient?.provider.connection;
                if (infoProps.walletToken && connection) {
                  // updateWalletToken(
                  //   infoProps.walletToken.address.toBase58(),
                  //   infoProps.walletToken.ata.toBase58(),
                  //   marginfiClient?.provider.connection
                  // );
                }
                refreshUserData();
              },
            }}
          />
        </div>
      )} */}
    </>
  );
}
