import React from "react";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useMediaQuery } from "react-responsive";

import { shortenAddress } from "@mrgnlabs/mrgn-common";
import { capture, Desktop, LendingModes, Mobile } from "@mrgnlabs/mrgn-utils";
import { ActionType, ExtendedBankInfo } from "@mrgnlabs/mrgn-state";
import { ActionBox, useWallet } from "@mrgnlabs/mrgn-ui";

import { useUiStore } from "~/store";

import { Banner } from "~/components/desktop/Banner";
import {
  Announcements,
  AnnouncementCustomItem,
  AnnouncementBankItem,
  AnnouncementsDialog,
  AnnouncementsSkeleton,
} from "~/components/common/Announcements/components";

import { OverlaySpinner } from "~/components/ui/overlay-spinner";
import { Loader } from "~/components/ui/loader";
import { EmodePortfolio } from "~/components/common/emode/components";
import { useBanks, useEmode, useExtendedBanks, useMarginfiAccount, useRefreshUserData } from "@mrgnlabs/mrgn-state";
import { useAssetData } from "~/hooks/use-asset-data.hooks";
import { PublicKey } from "@solana/web3.js";
import { useComputerStore } from "@mrgnlabs/fluxor-state";
import { GlobalStatistics } from "~/components/common/GlobalStatistics";

const DesktopAssetsList = dynamic(async () => (await import("~/components/desktop/AssetList")).AssetsList, {
  ssr: false,
});

const MobileAssetsList = dynamic(async () => (await import("~/components/mobile/AssetList")).MobileAssetList, {
  ssr: false,
});

function DesktopHome() {
  const { walletContextState, walletAddress, isOverride } = useWallet();
  const { connected } = useComputerStore();
  const assetData = useAssetData();

  const [lendingMode] = useUiStore((state) => [state.lendingMode]);

  const { extendedBanks, isLoading: isExtendedBanksLoading } = useExtendedBanks();
  const { activeEmodePairs, emodePairs } = useEmode();
  const { data: selectedAccount } = useMarginfiAccount();
  const refreshUserData = useRefreshUserData();

  const annoucements = React.useMemo(() => {
    let latestBanks: (ExtendedBankInfo | undefined)[] = [];

    if (extendedBanks) {
      const latestBankKeys = extendedBanks.slice(0, 3);
      latestBanks.push(...latestBankKeys);
    }

    return [
      ...latestBanks.map((bank) => ({
        bank: bank,
      })),
    ] as (AnnouncementBankItem | AnnouncementCustomItem)[];
  }, [extendedBanks]);

  return (
    <>
      <GlobalStatistics />
      <Desktop>
        <>
          <div className="flex flex-col h-full justify-start content-start w-full xl:w-4/5 xl:max-w-7xl gap-4">
            {/* {walletAddress && selectedAccount && isOverride && (
              <Banner
                text={`Read-only view of ${selectedAccount.address.toBase58()} (owner: ${shortenAddress(
                  walletAddress
                )}) - All actions are simulated`}
                backgroundColor="#4C9AEE"
              />
            )} */}
            {/* {annoucements.length > 0 ? <Announcements items={annoucements} /> : <AnnouncementsSkeleton />} */}
            {/* <AnnouncementsDialog /> */}
            <div className="p-4 space-y-4 w-full">
              <ActionBox.BorrowLend
                useProvider={true}
                lendProps={{
                  requestedLendType: lendingMode === LendingModes.LEND ? ActionType.Deposit : ActionType.Borrow,
                  connected,
                  walletContextState,
                  captureEvent: (event, properties) => {
                    capture(event, properties);
                  },
                  onComplete: (newAccountKey?: PublicKey) => {
                    refreshUserData({ newAccountKey });
                  },
                }}
              />
            </div>
          </div>
          <div className="pt-[16px] pb-[64px] px-4 w-full xl:w-4/5 xl:max-w-7xl mt-8 gap-4">
            <DesktopAssetsList data={assetData} />
          </div>
        </>
        <OverlaySpinner fetching={isExtendedBanksLoading} />
      </Desktop>
      <Mobile>
        <>
          {/* {annoucements.length > 0 ? <Announcements items={annoucements} /> : <AnnouncementsSkeleton />} */}
          {/* <AnnouncementsDialog /> */}
          <div className="p-4 space-y-3 w-full">
            {emodePairs.length > 0 && (
              <div className="max-w-[480px] mx-auto">
                <EmodePortfolio userActiveEmodes={activeEmodePairs} extendedBankInfos={extendedBanks} />
              </div>
            )}
            <MobileAssetsList extendedBanks={extendedBanks} />
            <OverlaySpinner fetching={isExtendedBanksLoading} />
            {/* <ActionBox.BorrowLend
              useProvider={true}
              lendProps={{
                requestedLendType: lendingMode === LendingModes.LEND ? ActionType.Deposit : ActionType.Borrow,
                connected: connected,
                walletContextState: walletContextState,
                onComplete: (newAccountKey?: PublicKey) => {
                  refreshUserData({ newAccountKey });
                },
              }}
            /> */}
          </div>
          <div className="mb-24" />
        </>
      </Mobile>
    </>
  );
}

export default function HomePage() {
  const router = useRouter();
  const isMobileHome = useMediaQuery({ maxWidth: 1023 });

  React.useEffect(() => {
    if (!isMobileHome) return;
    router.replace("/earn");
  }, [isMobileHome, router]);

  if (isMobileHome) {
    return <div className="min-h-screen bg-background pb-24" />;
  }

  return <DesktopHome />;
}
