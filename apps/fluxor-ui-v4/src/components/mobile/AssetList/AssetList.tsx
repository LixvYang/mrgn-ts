import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";

import { cn, LendingModes, PoolTypes } from "@mrgnlabs/mrgn-utils";
import { useWallet } from "@mrgnlabs/mrgn-ui";

import { useUiStore } from "~/store";

import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

import { TokenFilters } from "~/store/uiStore";
import { STABLECOINS, LSTS, MEMES } from "~/config/constants";
import { IMAGE_CDN_URL } from "~/config/constants";
import { dynamicNumeralFormatter, usdFormatter, percentFormatter, aprToApy } from "@mrgnlabs/mrgn-common";
import { ExtendedBankInfo } from "@mrgnlabs/mrgn-state";
import { OperationalState } from "@mrgnlabs/marginfi-client-v2";

type AssetListProps = {
  extendedBanks: ExtendedBankInfo[];
};

type MobileAssetCardProps = {
  bank: ExtendedBankInfo;
};

const MobileAssetCard = ({ bank }: MobileAssetCardProps) => {
  const router = useRouter();

  const formatAmount = (amount: number) => {
    return dynamicNumeralFormatter(amount, {
      forceDecimals: true,
    });
  };

  const formatUSD = (amount: number) => {
    return usdFormatter.format(amount);
  };

  const formatAPY = (rate: number) => {
    return percentFormatter.format(aprToApy(rate));
  };

  const handleDetailClick = () => {
    router.push(`/banks/${bank.info.rawBank.address.toBase58()}`);
  };

  return (
    <Card className="transition-colors">
      <CardContent className="p-4">
        {/* Asset Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative size-8">
            <Image
              src={bank.meta.tokenLogoUri || ""}
              alt={`${bank.meta.tokenSymbol} logo`}
              height={32}
              width={32}
              className="rounded-full size-8"
            />
            {bank.meta.chainLogoUri && (
              <div className="absolute -bottom-1 -right-1 size-3.5">
                <Image
                  src={bank.meta.chainLogoUri}
                  alt="chain logo"
                  height={14}
                  width={14}
                  className="rounded-full size-3.5 border"
                />
              </div>
            )}
          </div>
          <div>
            <div className="font-medium text-sm">{bank.meta.tokenSymbol}</div>
            <div className="text-xs text-muted-foreground">{bank.meta.tokenName}</div>
          </div>
        </div>

        {/* Supply Data */}
        <div className="space-y-2 mb-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">总存入量</span>
            <div className="text-right">
              <div className="text-sm font-medium">{formatAmount(bank.info.state.totalDeposits)}</div>
              <div className="text-xs text-muted-foreground">
                ${formatAmount(bank.info.state.totalDeposits * bank.info.state.price)}
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">存入 APY</span>
            <div className={cn("text-right", "text-success")}>
              <div className="text-sm font-medium">{formatAPY(bank.info.state.lendingRate)}</div>
              {/* {bank.info.state.emissionsRate && bank.info.state.emissionsRate > 0 && (
                <div className="text-xs text-emerald-500">+{formatAPY(bank.info.state.emissionsRate)} 奖励</div>
              )} */}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-3"></div>

        {/* Borrow Data */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">总借出量</span>
            <div className="text-right">
              <div className="text-sm font-medium">{formatAmount(bank.info.state.totalBorrows)}</div>
              <div className="text-xs text-muted-foreground">
                ${formatAmount(bank.info.state.totalBorrows * bank.info.state.price)}
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">借出 APY</span>
            <div className={cn("text-right", "text-warning")}>
              <div className="text-sm font-medium">{formatAPY(bank.info.state.borrowingRate)}</div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button variant="secondary" className="w-full text-sm" onClick={handleDetailClick}>
          详情
        </Button>
      </CardContent>
    </Card>
  );
};

export const MobileAssetList = ({ extendedBanks }: AssetListProps) => {
  const router = useRouter();
  const [lendingMode] = useUiStore((state) => [state.lendingMode]);

  // Filter out reduce-only banks (unless user has open position or showReduceOnlyBanks is set)
  const filteredBanks = React.useMemo(() => {
    if (!extendedBanks || extendedBanks.length === 0) return [];

    // Check if showReduceOnlyBanks query parameter is set
    const showReduceOnlyBanks = router.query.showReduceOnlyBanks;

    return extendedBanks.filter((bank) => {
      // Filter out reduce only banks (unless user has open position or showReduceOnlyBanks is set)
      if (!showReduceOnlyBanks) {
        const isReduceOnly = bank.info.rawBank.config.operationalState === OperationalState.ReduceOnly;
        const hasPosition = bank.isActive; // ExtendedBankInfo.isActive indicates if user has a position
        return !(isReduceOnly && !hasPosition);
      }
      return true;
    });
  }, [extendedBanks, router.query.showReduceOnlyBanks]);

  if (!extendedBanks || extendedBanks.length === 0) {
    return (
      <div className="space-y-4 p-4">
        {/* Skeleton cards */}
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="p-4">
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative size-8">
                  <Skeleton className="size-8 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <Skeleton className="h-px w-full" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {filteredBanks.map((bank, index) => (
        <MobileAssetCard key={`${bank.info.rawBank.address.toBase58()}-${index}`} bank={bank} />
      ))}
    </div>
  );
};
