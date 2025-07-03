import React from "react";
import { OverlaySpinner } from "~/components/ui/overlay-spinner";
import { Loader } from "~/components/ui/loader";
import { useRouter } from "next/router";
import { useAppStore, useMrgnlendStore, useUiStore } from "~/store";
import { Desktop, Mobile } from "~/mediaQueryUtils";
import { ActionBox } from "~/components";
import { ActionType, ExtendedBankInfo } from "@mrgnlabs/marginfi-v2-ui-state";
import { LendingModes, useConnection } from "@mrgnlabs/mrgn-utils";
import dynamic from "next/dynamic";
import { initComputerClient } from "@mrgnlabs/mrgn-common";
import { AnnouncementBankItem, AnnouncementCustomItem, Announcements } from "~/components/common/Announcements";
import { AnnouncementsDialog } from "~/components/common/Announcements";

const AssetsList = dynamic(async () => (await import("~/components/desktop/AssetList")).AssetsList, {
  ssr: false,
});

export default function HomePage() {
  const router = useRouter();
  const [lendingMode] = useUiStore((state) => [state.lendingMode]);
  const [
    connected,
    getUserMix,
    computerInfo,
    computerAccount,
    getComputerRecipient,
    balanceAddressMap,
    getMixinClient,
    register,
    publicKey,
  ] = useAppStore((state) => [
    state.connected,
    state.getUserMix,
    state.info,
    state.account,
    state.getComputerRecipient,
    state.balanceAddressMap,
    state.getMixinClient,
    state.register,
    state.publicKey,
  ]);
  const mixinClient = getMixinClient();
  const { connection } = useConnection();

  const [
    isStoreInitialized,
    isRefreshingStore,
    selectedAccount,
    extendedBankInfos,
    fetchMrgnlendState,
    marginfiClient,
    stakeAccounts,
  ] = useMrgnlendStore((state) => [
    state.initialized,
    state.isRefreshingStore,
    state.selectedAccount,
    state.extendedBankInfos,
    state.fetchMrgnlendState,
    state.marginfiClient,
    state.stakeAccounts,
  ]);

  const annoucements = React.useMemo(() => {
    let banks: (ExtendedBankInfo | undefined)[] = [];

    if (marginfiClient?.banks) {
      const latestBankKeys = Array.from(marginfiClient.banks.keys()).splice(0, 3);
      banks.push(
        ...latestBankKeys
          .map((bankKey) => extendedBankInfos.find((bank) => bank.address.toBase58() === bankKey))
          .filter((bank): bank is ExtendedBankInfo => bank !== undefined)
      );
    }

    banks = banks.filter((bank): bank is ExtendedBankInfo => bank !== undefined);
    return [
      ...banks.map((bank) => ({
        bank: bank,
      })),
    ] as (AnnouncementBankItem | AnnouncementCustomItem)[];
  }, [extendedBankInfos, marginfiClient]);

  return (
    <>
      <Desktop>
        {!isStoreInitialized && <Loader label="Loading Fluxor Lend..." className="mt-16" />}
        {isStoreInitialized && (
          <>
            <div className="flex flex-col h-full justify-start content-start w-full xl:w-4/5 xl:max-w-7xl gap-4">
              <div className="p-4 space-y-4 w-full">
                <Announcements items={annoucements} />
                <AnnouncementsDialog />

                <ActionBox.BorrowLend
                  useProvider={true}
                  lendProps={{
                    requestedLendType: lendingMode === LendingModes.LEND ? ActionType.Deposit : ActionType.Borrow,
                    connected,
                    // walletContextState,
                    // stakeAccounts,
                    captureEvent: (event, properties) => {
                      // capture(event, properties);
                    },
                    onComplete: () => {
                      fetchMrgnlendState();
                    },
                    isMixinLend: true,
                    isMixinComputerRegister: register,
                    getUserMix: getUserMix,
                    computerInfo: computerInfo,
                    connection: connection,
                    computerAccount: computerAccount,
                    getComputerRecipient: getComputerRecipient,
                    balanceAddressMap: balanceAddressMap,
                  }}
                />
              </div>
            </div>
            <div className="pt-[16px] pb-[64px] px-4 w-full xl:w-4/5 xl:max-w-7xl mt-8 gap-4">
              <AssetsList />
            </div>
          </>
        )}
      </Desktop>

      <Mobile>
        {!isStoreInitialized && <Loader label="Loading Fluxor Lend..." className="mt-16" />}
        {isStoreInitialized && (
          <>
            <Announcements items={annoucements} />
            <AnnouncementsDialog />
            <div className="p-4 space-y-4 w-full">
              <ActionBox.BorrowLend
                useProvider={true}
                lendProps={{
                  requestedLendType: lendingMode === LendingModes.LEND ? ActionType.Deposit : ActionType.Borrow,
                  connected: connected,
                  // walletContextState: walletContextState,
                  stakeAccounts,
                  onComplete: () => {
                    fetchMrgnlendState();
                  },
                  isMixinLend: true,
                  isMixinComputerRegister: register,
                  // getUserMix: getUserMix,
                  // computerInfo: computerInfo,
                  // connection: connection,
                  // computerAccount: computerAccount,
                  // getComputerRecipient: getComputerRecipient,
                  // balanceAddressMap: balanceAddressMap,
                  // fetchTransaction: mixinClient.utxo.fetchTransaction,
                }}
              />
            </div>
            <div className="mb-24" />
          </>
        )}
      </Mobile>
    </>
  );
}
