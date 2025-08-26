"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useFluxorStore } from "@mrgnlabs/fluxor-state";
import { FluxorGlobalStatisticsResponse } from "@mrgnlabs/mrgn-common";
import { usdFormatter } from "@mrgnlabs/mrgn-common";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@mrgnlabs/mrgn-ui/src/components/ui/dialog";
import { IconChevronDown, IconX } from "@tabler/icons-react";
import { cn } from "@mrgnlabs/mrgn-utils";
import { getConfig } from "@mrgnlabs/mrgn-state";

interface StatItemProps {
  label: string;
  value: string;
  icon: string;
  percentage: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, icon, percentage }) => (
  <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-gray-800/50 transition-colors">
    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
      <div className="w-6 h-6 sm:w-8 sm:h-8 relative flex-shrink-0">
        <Image
          src={icon}
          alt={label}
          fill
          className="rounded-full object-cover"
          sizes="(max-width: 640px) 24px, 32px"
        />
      </div>
      <span className="text-white text-xs sm:text-sm font-medium truncate">{label}</span>
    </div>
    <div className="text-right flex-shrink-0 ml-2">
      <div className="text-white font-semibold text-xs sm:text-sm">{value}</div>
      <div className="text-gray-400 text-xs">{percentage}</div>
    </div>
  </div>
);

const GlobalStatistics: React.FC = () => {
  const { getGlobalStatistics } = useFluxorStore();
  const [data, setData] = useState<FluxorGlobalStatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"supply" | "borrow">("supply");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = getConfig();
        if (!config?.mrgnConfig?.groupPk) {
          console.warn("Configuration not yet initialized");
          return;
        }

        const result = await getGlobalStatistics(config.mrgnConfig.groupPk.toBase58());
        setData(result);
      } catch (error) {
        console.error("Failed to fetch global statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getGlobalStatistics]);

  const handleStatClick = (type: "supply" | "borrow") => {
    setActiveView(type);
    setIsDetailModalOpen(true);
  };

  if (loading) {
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

  if (!data) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-3 sm:p-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-8">
          <span className="text-gray-400 text-sm">无法加载数据</span>
        </div>
      </div>
    );
  }

  const currentItems = activeView === "supply" ? data.supplyItems : data.borrowItems;

  return (
    <>
      <div className="bg-background rounded-lg p-3 sm:p-4 max-w-4xl mx-auto">
        {/* <h2 className="text-white text-base sm:text-lg font-semibold mb-3 sm:mb-4">Lending Market</h2> */}

        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* TVL */}
          <div className="text-center flex-1">
            <div className="text-gray-400 text-xs sm:text-sm mb-1">总锁仓</div>
            <div className="text-emerald-400 text-sm sm:text-lg md:text-xl font-bold">
              {usdFormatter.format(parseFloat(data.tvl))}
            </div>
          </div>

          {/* Total Supply */}
          <div
            className="text-center cursor-pointer hover:bg-gray-800 rounded-lg p-1 sm:p-2 transition-colors flex-1"
            onClick={() => handleStatClick("supply")}
          >
            <div className="text-gray-400 text-xs sm:text-sm mb-1 flex items-center justify-center gap-1">
              <span className="hidden sm:inline">Total </span>Supply
              <IconChevronDown size={12} className="sm:size-3 md:size-4" />
            </div>
            <div className="text-success text-sm sm:text-lg md:text-xl font-bold">
              {usdFormatter.format(parseFloat(data.totalSupply))}
            </div>
          </div>

          {/* Total Borrow */}
          <div
            className="text-center cursor-pointer hover:bg-gray-800 rounded-lg p-1 sm:p-2 transition-colors flex-1"
            onClick={() => handleStatClick("borrow")}
          >
            <div className="text-gray-400 text-xs sm:text-sm mb-1 flex items-center justify-center gap-1">
              <span className="hidden sm:inline">Total </span>Borrow
              <IconChevronDown size={12} className="sm:size-3 md:size-4" />
            </div>
            <div className="text-warning text-sm sm:text-lg md:text-xl font-bold">
              {usdFormatter.format(parseFloat(data.totalBorrow))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal - 移动端和桌面端都使用 Dialog */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent
          size="sm"
          hideClose
          hidePadding
          isBgGlass={true}
          className="bg-background border-border shadow-xl rounded-lg"
          position="center"
        >
          <div className="w-full max-w-sm mx-auto bg-background rounded-lg p-6 relative">
            {/* 关闭按钮 - 移到内容区域内 */}
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

            {/* Total Amount - Fixed Header */}
            <div className="mb-6 pb-4 border-b border-border">
              <div className={cn("text-2xl font-bold", activeView === "supply" ? "text-success" : "text-warning")}>
                {usdFormatter.format(parseFloat(activeView === "supply" ? data.totalSupply : data.totalBorrow))}
              </div>
            </div>

            {/* Scrollable List */}
            <div className="max-h-[60vh] overflow-y-auto space-y-2 -mx-2 px-2">
              {currentItems.map((item, index) => {
                const value = activeView === "supply" ? item.supply || "0" : item.borrow || "0";
                return (
                  <StatItem
                    key={index}
                    label={item.bankAsset.symbol}
                    value={usdFormatter.format(parseFloat(value))}
                    icon={item.bankAsset.iconUrl}
                    percentage={`${parseFloat(item.ratio).toFixed(2)}%`}
                  />
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GlobalStatistics;
