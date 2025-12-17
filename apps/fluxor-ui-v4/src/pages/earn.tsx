import React, { useMemo, useState } from "react";
import { useRouter } from "next/router";

import { numeralFormatter, percentFormatter, usdFormatter } from "@mrgnlabs/mrgn-common";
import { PoolTypes } from "@mrgnlabs/mrgn-utils";
import { IconCoins } from "@tabler/icons-react";

import { useMarginfiAccount, useMarginfiAccountAddresses } from "@mrgnlabs/mrgn-state";
import { useAssetData } from "~/hooks/use-asset-data.hooks";
import { useMixinWalletConnection } from "~/hooks/use-mixin-wallet-connection";
import { LoginModal } from "~/components/common/MixinWallet";
import { MixinRegisterModal } from "~/components/common/MixinWallet/components/MixinRegisterModal";
import { EarnAssetCard } from "~/components/mobile/ProductCards";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useUiStore } from "~/store";
import { useComputerStore } from "@mrgnlabs/fluxor-state";

const formatUsdCompact = (value: number) => `$${numeralFormatter(value)}`;
const formatUsd = (value: number) => usdFormatter.format(value);

export default function EarnPage() {
  const router = useRouter();
  const { connected, showLoginModal, handleConnect, handleConnected, handleCloseModal } = useMixinWalletConnection();
  const register = useComputerStore((s) => s.register);
  const canUse = connected && register;
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const assetData = useAssetData();
  const {
    data: marginfiAccountAddresses,
    isLoading: isMarginfiAccountAddressesLoading,
    isSuccess: isMarginfiAccountAddressesSuccess,
  } = useMarginfiAccountAddresses();
  const { isLoading: isMarginfiAccountLoading, isFetched: isMarginfiAccountFetched } = useMarginfiAccount();

  const isUserDataLoading =
    canUse &&
    (!assetData.isReady ||
      isMarginfiAccountAddressesLoading ||
      (isMarginfiAccountAddressesSuccess &&
        (marginfiAccountAddresses?.length ?? 0) > 0 &&
        (!isMarginfiAccountFetched || isMarginfiAccountLoading)));
  const [poolFilter] = useUiStore((state) => [state.poolFilter]);

  const { protocolDepositsUsd, userDepositsUsd, netApy, filteredAssets } = useMemo(() => {
    // Apply filtering logic similar to desktop AssetList
    let filtered = assetData.lendData;

    // Filter by pool category
    filtered = filtered.filter((item) => {
      const categories = item.assetCategory || [];
      switch (poolFilter) {
        case PoolTypes.E_MODE:
          return categories.includes(PoolTypes.E_MODE);
        case PoolTypes.GLOBAL:
          return categories.includes(PoolTypes.GLOBAL);
        case PoolTypes.ISOLATED:
          return categories.includes(PoolTypes.ISOLATED);
        case PoolTypes.NATIVE_STAKE:
          return categories.includes(PoolTypes.NATIVE_STAKE);
        default:
          return true;
      }
    });

    // Filter out reduce only banks (unless user has open position or showReduceOnlyBanks is set)
    const showReduceOnlyBanks = router.query.showReduceOnlyBanks;
    if (!showReduceOnlyBanks) {
      filtered = filtered.filter((item) => {
        return !(item.asset.isReduceOnly && !item.position.positionAmount);
      });
    }

    // Sort by total deposits
    const sorted = [...filtered].sort(
      (a, b) => (b?.deposits.bankDepositsUsd || 0) - (a?.deposits.bankDepositsUsd || 0)
    );

    // Calculate aggregates from filtered data
    const totalProtocol = filtered.reduce((sum, row) => sum + (row?.deposits.bankDepositsUsd || 0), 0);
    const userTotal = filtered.reduce((sum, row) => sum + (row?.position.positionUsd || 0), 0);
    const userWeightedApyNumerator = filtered.reduce(
      (sum, row) => sum + (row.rate.rateAPY || 0) * (row?.position.positionUsd || 0),
      0
    );
    const netApyCalc = userTotal > 0 ? userWeightedApyNumerator / userTotal : 0;

    return {
      protocolDepositsUsd: totalProtocol,
      userDepositsUsd: userTotal,
      netApy: netApyCalc,
      filteredAssets: sorted, // Show top 12
    };
  }, [assetData.lendData, poolFilter, router.query.showReduceOnlyBanks]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <LoginModal open={showLoginModal} onClose={handleCloseModal} onConnected={handleConnected} />
      <MixinRegisterModal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} />

      <div className="mx-4 mt-6 rounded-2xl border border-border/50 bg-muted/20 p-4 space-y-4">
        <Card className="bg-background/70 border border-border/60 shadow-sm">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">协议数据</p>
            <dl className="space-y-2">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-base text-muted-foreground">总存款</dt>
                <dd className="text-right font-semibold tabular-nums">
                  {!assetData.isReady ? <Skeleton className="h-4 w-24" /> : formatUsdCompact(protocolDepositsUsd)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {!connected && (
          <Card className="bg-background/70 border border-border/60 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <IconCoins size={40} className="text-success shrink-0" />
                <div>
                  <p className="text-base font-semibold text-foreground">Earn</p>
                  <p className="text-xs text-muted-foreground">存款生息</p>
                </div>
              </div>
              <Button onClick={handleConnect} className="w-full">
                连接钱包
              </Button>
            </CardContent>
          </Card>
        )}

        {connected && !register && (
          <Card className="bg-background/70 border border-border/60 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-base font-semibold text-foreground">需要注册 Computer 才能使用借贷</p>
                <p className="text-xs text-muted-foreground mt-1">
                  未注册时 Sol 公钥为默认值，无法进行存款/借款等操作。
                </p>
              </div>
              <Button onClick={() => setShowRegisterModal(true)} className="w-full">
                注册 Computer
              </Button>
            </CardContent>
          </Card>
        )}

        {canUse && (
          <Card className="bg-background/70 border border-border/60 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">我的存款</p>
              <dl className="space-y-2">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-base text-muted-foreground">存款金额</dt>
                  <dd className="text-right tabular-nums">
                    {isUserDataLoading ? (
                      <Skeleton className="h-7 w-36" />
                    ) : (
                      <span className="text-base font-bold text-foreground">{formatUsd(userDepositsUsd)}</span>
                    )}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-base text-muted-foreground">平均年化</dt>
                  <dd className="text-right tabular-nums">
                    {isUserDataLoading ? (
                      <Skeleton className="h-5 w-20" />
                    ) : (
                      <span className="text-base font-semibold text-success">{percentFormatter.format(netApy)}</span>
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mx-4 mt-6 rounded-2xl border border-border/40 bg-card/30 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Vaults</h2>
        </div>

        <div className="mt-4">
          {!assetData.isReady && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Card key={idx} className="bg-background/70 border border-border/60">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-11 w-11 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {assetData.isReady && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAssets.map((asset) => (
                <EarnAssetCard
                  key={asset.asset.address.toBase58()}
                  asset={asset}
                  isConnected={canUse}
                  onConnect={handleConnect}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
