"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { dynamicNumeralFormatter, usdFormatter } from "@mrgnlabs/mrgn-common";
import { ExtendedBankInfo, useExtendedBanks } from "@mrgnlabs/mrgn-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@mrgnlabs/mrgn-ui/src/components/ui/dialog";
import { IconChevronDown, IconX } from "@tabler/icons-react";
import { cn } from "@mrgnlabs/mrgn-utils";
import { OperationalState } from "@mrgnlabs/marginfi-client-v2";

interface AggregatedItem {
  id: string;
  symbol: string;
  tokenName: string;
  tokenIcon: string;
  chainIcon?: string | null;
  amount: number;
  amountUsd: number;
  ratio: number;
  statusLabel?: string | null;
  statusVariant?: "warning" | "destructive";
}

interface ComputedStats {
  tvl: number;
  totalSupplyUsd: number;
  totalBorrowUsd: number;
  supplyItems: AggregatedItem[];
  borrowItems: AggregatedItem[];
}

const formatPercentage = (value: number) => {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${value.toFixed(2)}%`;
};

const formatTokenAmount = (amount: number, symbol: string) => {
  const formatted = dynamicNumeralFormatter(amount, { ignoreMinDisplay: true, forceDecimals: true });
  return `${formatted} ${symbol}`;
};

const getStatusMeta = (
  state?: OperationalState
): { label?: string | null; variant?: "warning" | "destructive" } => {
  switch (state) {
    case OperationalState.ReduceOnly:
      return { label: "Reduce Only", variant: "warning" };
    case OperationalState.Paused:
      return { label: "Paused", variant: "destructive" };
    default:
      return { label: null, variant: undefined };
  }
};

const aggregateStats = (banks: ExtendedBankInfo[]): ComputedStats | null => {
  if (!banks || banks.length === 0) {
    return null;
  }

  let totalSupplyUsd = 0;
  let totalBorrowUsd = 0;

  const supplyItemsRaw: AggregatedItem[] = [];
  const borrowItemsRaw: AggregatedItem[] = [];

  banks.forEach((bank) => {
    const price = bank.info.state.price ?? 0;
    const supplyAmount = bank.info.state.totalDeposits ?? 0;
    const borrowAmount = bank.info.state.totalBorrows ?? 0;
    const supplyUsd = supplyAmount * price;
    const borrowUsd = borrowAmount * price;

    totalSupplyUsd += supplyUsd;
    totalBorrowUsd += borrowUsd;

    const statusMeta = getStatusMeta(bank.info.rawBank.config.operationalState);

    supplyItemsRaw.push({
      id: `${bank.address.toBase58()}-supply`,
      symbol: bank.meta.tokenSymbol,
      tokenName: bank.meta.tokenName,
      tokenIcon: bank.meta.tokenLogoUri || "",
      chainIcon: bank.meta.chainLogoUri,
      amount: supplyAmount,
      amountUsd: supplyUsd,
      ratio: 0,
      statusLabel: statusMeta.label,
      statusVariant: statusMeta.variant,
    });

    borrowItemsRaw.push({
      id: `${bank.address.toBase58()}-borrow`,
      symbol: bank.meta.tokenSymbol,
      tokenName: bank.meta.tokenName,
      tokenIcon: bank.meta.tokenLogoUri || "",
      chainIcon: bank.meta.chainLogoUri,
      amount: borrowAmount,
      amountUsd: borrowUsd,
      ratio: 0,
      statusLabel: statusMeta.label,
      statusVariant: statusMeta.variant,
    });
  });

  const finalizeItems = (items: AggregatedItem[], total: number) => {
    const hasValue = items.some((item) => item.amountUsd > 0);
    const baseItems = hasValue ? items.filter((item) => item.amountUsd > 0) : items;

    return baseItems
      .map((item) => ({
        ...item,
        ratio: total > 0 ? (item.amountUsd / total) * 100 : 0,
      }))
      .sort((a, b) => b.amountUsd - a.amountUsd);
  };

  return {
    tvl: Math.max(totalSupplyUsd - totalBorrowUsd, 0),
    totalSupplyUsd,
    totalBorrowUsd,
    supplyItems: finalizeItems(supplyItemsRaw, totalSupplyUsd),
    borrowItems: finalizeItems(borrowItemsRaw, totalBorrowUsd),
  };
};

interface StatItemProps {
  label: string;
  tokenName: string;
  tokenIcon: string;
  chainIcon?: string | null;
  amount: number;
  amountUsd: number;
  ratio: number;
  statusLabel?: string | null;
  statusVariant?: "warning" | "destructive";
}

const StatItem: React.FC<StatItemProps> = ({
  label,
  tokenName,
  tokenIcon,
  chainIcon,
  amount,
  amountUsd,
  ratio,
  statusLabel,
  statusVariant,
}) => (
  <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-gray-800/50 transition-colors">
    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
      <div className="relative size-8 sm:size-10 flex-shrink-0">
        <Image
          src={tokenIcon || ""}
          alt={label}
          fill
          className="rounded-full object-cover"
          sizes="(max-width: 640px) 32px, 40px"
        />
        {chainIcon && (
          <div className="absolute -bottom-1 -right-1 size-4">
            <Image
              src={chainIcon}
              alt={`${label} chain`}
              fill
              className="rounded-full border border-background object-cover"
              sizes="16px"
            />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-white text-sm font-semibold truncate">{label}</span>
          {statusLabel && (
            <span
              className={cn(
                "text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border",
                statusVariant === "destructive"
                  ? "border-red-500/60 text-red-300"
                  : "border-amber-400/60 text-amber-200"
              )}
            >
              {statusLabel}
            </span>
          )}
        </div>
        <div className="text-gray-400 text-xs truncate">{tokenName}</div>
      </div>
    </div>
    <div className="text-right flex-shrink-0 ml-2">
      <div className="text-white font-semibold text-xs sm:text-sm">{usdFormatter.format(amountUsd)}</div>
      <div className="text-gray-400 text-[11px] sm:text-xs">
        {formatTokenAmount(amount, label)} · {formatPercentage(ratio)}
      </div>
    </div>
  </div>
);

const GlobalStatistics2: React.FC = () => {
  const { extendedBanks, isLoading } = useExtendedBanks();
  const stats = useMemo(() => aggregateStats(extendedBanks), [extendedBanks]);
  const [activeView, setActiveView] = useState<"supply" | "borrow">("supply");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleStatClick = (type: "supply" | "borrow") => {
    if (!stats) return;
    setActiveView(type);
    setIsDetailModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-3 sm:p-4 max-w-4xl mx-auto">
        <div className="h-5 sm:h-6 bg-gray-600 rounded w-32 mb-3 sm:mb-4 animate-pulse"></div>
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="animate-pulse text-center flex-1">
            <div className="h-3 sm:h-4 bg-gray-600 rounded w-6 sm:w-8 mb-2 mx-auto"></div>
            <div className="h-5 sm:h-6 md:h-8 bg-gray-700 rounded w-12 sm:w-16 md:w-20 mx-auto"></div>
          </div>
          <div className="animate-pulse text-center flex-1">
            <div className="h-3 sm:h-4 bg-gray-600 rounded w-16 sm:w-20 mb-2 mx-auto"></div>
            <div className="h-5 sm:h-6 md:h-8 bg-gray-700 rounded w-16 sm:w-20 md:w-24 mx-auto"></div>
          </div>
          <div className="animate-pulse text-center flex-1">
            <div className="h-3 sm:h-4 bg-gray-600 rounded w-16 sm:w-20 mb-2 mx-auto"></div>
            <div className="h-5 sm:h-6 md:h-8 bg-gray-700 rounded w-16 sm:w-20 md:w-24 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-3 sm:p-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-8">
          <span className="text-gray-400 text-sm">无法加载数据</span>
        </div>
      </div>
    );
  }

  const currentItems = activeView === "supply" ? stats.supplyItems : stats.borrowItems;

  return (
    <>
      <div className="bg-background rounded-lg p-3 sm:p-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="text-center flex-1">
            <div className="text-gray-400 text-xs sm:text-sm mb-1">TVL</div>
            <div className="text-emerald-400 text-sm sm:text-lg md:text-xl font-bold">
              {usdFormatter.format(stats.tvl)}
            </div>
          </div>

          <div
            className="text-center cursor-pointer hover:bg-gray-800 rounded-lg p-1 sm:p-2 transition-colors flex-1"
            onClick={() => handleStatClick("supply")}
          >
            <div className="text-gray-400 text-xs sm:text-sm mb-1 flex items-center justify-center gap-1">
              <span className="hidden sm:inline">Total </span>Supply
              <IconChevronDown size={12} className="sm:size-3 md:size-4" />
            </div>
            <div className="text-success text-sm sm:text-lg md:text-xl font-bold">
              {usdFormatter.format(stats.totalSupplyUsd)}
            </div>
          </div>

          <div
            className="text-center cursor-pointer hover:bg-gray-800 rounded-lg p-1 sm:p-2 transition-colors flex-1"
            onClick={() => handleStatClick("borrow")}
          >
            <div className="text-gray-400 text-xs sm:text-sm mb-1 flex items-center justify-center gap-1">
              <span className="hidden sm:inline">Total </span>Borrow
              <IconChevronDown size={12} className="sm:size-3 md:size-4" />
            </div>
            <div className="text-warning text-sm sm:text-lg md:text-xl font-bold">
              {usdFormatter.format(stats.totalBorrowUsd)}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(stats) && isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent
          size="sm"
          hideClose
          hidePadding
          isBgGlass={true}
          className="bg-background border-border shadow-xl rounded-lg"
          position="center"
        >
          <div className="w-full max-w-sm mx-auto bg-background rounded-lg p-6 relative">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-full p-2 opacity-70 hover:opacity-100 transition-opacity hover:bg-muted"
            >
              <IconX size={18} className="text-muted-foreground hover:text-foreground" />
              <span className="sr-only">关闭</span>
            </button>

            <DialogHeader className="mb-6 pr-10">
              <DialogTitle className="text-foreground text-lg font-semibold text-left">
                {activeView === "supply" ? "Total Supply" : "Total Borrow"}
              </DialogTitle>
            </DialogHeader>

            <div className="mb-6 pb-4 border-b border-border">
              <div className={cn("text-2xl font-bold", activeView === "supply" ? "text-success" : "text-warning")}>
                {usdFormatter.format(activeView === "supply" ? stats.totalSupplyUsd : stats.totalBorrowUsd)}
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2 -mx-2 px-2">
              {currentItems.map((item) => (
                <StatItem
                  key={item.id}
                  label={item.symbol}
                  tokenName={item.tokenName}
                  tokenIcon={item.tokenIcon}
                  chainIcon={item.chainIcon || undefined}
                  amount={item.amount}
                  amountUsd={item.amountUsd}
                  ratio={item.ratio}
                  statusLabel={item.statusLabel}
                  statusVariant={item.statusVariant}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GlobalStatistics2;
