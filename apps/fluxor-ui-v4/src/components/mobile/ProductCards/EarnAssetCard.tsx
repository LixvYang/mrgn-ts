import React from "react";
import Link from "next/link";
import Image from "next/image";

import { dynamicNumeralFormatter, percentFormatter, usdFormatter } from "@mrgnlabs/mrgn-common";

import { AssetListModel } from "~/components/desktop/AssetList/utils";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

interface EarnAssetCardProps {
  asset: AssetListModel;
  isConnected: boolean;
  onConnect?: () => void;
}

const formatAmount = (value: number) =>
  dynamicNumeralFormatter(value, {
    forceDecimals: true,
  });

const formatUsd = (value: number) => usdFormatter.format(value);

export const EarnAssetCard = ({ asset, isConnected, onConnect }: EarnAssetCardProps) => {
  const detailHref = `/banks/${asset.asset.address.toBase58()}`;
  const tokenLogoUri = asset.asset.image || "";
  const chainLogoUri = asset.asset.chainImage || "";

  return (
    <Card className="bg-card/70 border border-border/60 shadow-sm transition-colors">
      <CardContent className="p-4">
        {/* Asset Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative size-11">
            <Image
              src={tokenLogoUri}
              alt={`${asset.asset.symbol} logo`}
              height={44}
              width={44}
              className="rounded-full size-11"
            />
            {chainLogoUri && (
              <div className="absolute -bottom-1 -right-1 size-4">
                <Image
                  src={chainLogoUri}
                  alt="chain logo"
                  height={16}
                  width={16}
                  className="rounded-full size-4 border border-background"
                />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
              {asset.asset.name}
              {asset.asset.isReduceOnly && <Badge variant="outline">只可减少</Badge>}
            </div>
            <div className="text-xs text-muted-foreground">{asset.asset.symbol}</div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-success text-2xl font-bold leading-tight">
              {percentFormatter.format(asset.rate.rateAPY)}
            </div>
          </div>
        </div>

        {/* Supply Data */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">总存入量</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium">{formatAmount(asset.deposits.bankDeposits)}</span>
              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                {formatUsd(asset.deposits.bankDepositsUsd)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isConnected ? (
          <div className="space-y-3">
            <div className="w-full">{asset.action}</div>
            <Button asChild variant="outline" className="w-full border-border/70">
              <Link href={detailHref} className="flex items-center justify-center gap-1 text-sm">
                详情
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className={`border-border/70 ${onConnect ? "flex-1" : "w-full"}`}
            >
              <Link href={detailHref} className="flex items-center justify-center gap-1 text-sm">
                详情
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EarnAssetCard;
