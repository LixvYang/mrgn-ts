"use client";

import React, { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { IconLoader2 } from "@tabler/icons-react";

import { dynamicNumeralFormatter, FluxorBankTvlApyResponse } from "@mrgnlabs/mrgn-common";
import { useExtendedBanks } from "@mrgnlabs/mrgn-state";
import { useFluxorStore } from "@mrgnlabs/fluxor-state";
import { getConfig } from "@mrgnlabs/mrgn-state";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent } from "~/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { Switch } from "~/components/ui/switch";

import { formatDate, formatChartData, generateInterestCurveData } from "../utils/bank-chart.utils";
import { chartConfigs, chartColors } from "../types";

type Tabs = "rates" | "tvl" | "interest-curve";

type BankChartProps = {
  bankAddress: string;
  tab?: Tabs;
};

const headerContent: Record<Tabs, { title: string; description: string }> = {
  tvl: {
    title: "TVL（锁仓规模）",
    description: "展示该银行近一段时间的总锁仓及借款规模。",
  },
  rates: {
    title: "利率表现",
    description: "展示存款与借款利率的历史走势。",
  },
  "interest-curve": {
    title: "利率曲线",
    description: "展示不同利用率下的利率曲线，便于评估资金成本。",
  },
};

const BankChart2 = ({ bankAddress, tab = "tvl" }: BankChartProps) => {
  const [activeTab, setActiveTab] = React.useState<Tabs>(tab);
  const [showUSD, setShowUSD] = React.useState(false);
  const selectedDays = 7;
  const [fluxorData, setFluxorData] = useState<FluxorBankTvlApyResponse | null>(null);
  const [fluxorLoading, setFluxorLoading] = useState(true);
  const [fluxorError, setFluxorError] = useState<string | null>(null);

  const { extendedBanks } = useExtendedBanks();
  const { getTvlApy } = useFluxorStore();

  React.useEffect(() => {
    if (activeTab !== "tvl") {
      setShowUSD(false);
    }
  }, [activeTab]);

  const bank = React.useMemo(() => {
    return extendedBanks.find((bank) => bank.address.toBase58() === bankAddress);
  }, [extendedBanks, bankAddress]);

  const isNativeStakeBank = bank?.info.rawBank.config.assetTag === 2;

  const currentUtilizationRateDecimal = React.useMemo(() => {
    if (!bank) return 0;
    return bank.info.state.utilizationRate / 100; // Convert from percentage to decimal
  }, [bank]);

  // 使用 Fluxor Store 获取数据
  useEffect(() => {
    const fetchFluxorData = async () => {
      try {
        setFluxorLoading(true);
        setFluxorError(null);

        const config = getConfig();
        if (!config?.mrgnConfig?.groupPk) {
          console.warn("Configuration not yet initialized");
          return;
        }

        const result = await getTvlApy(
          config.mrgnConfig.groupPk.toBase58(),
          bankAddress,
          selectedDays // 使用选中的天数
        );

        setFluxorData(result);
      } catch (error) {
        console.error("Failed to fetch fluxor TVL/APY data:", error);
        setFluxorError(error instanceof Error ? error.message : "Failed to fetch data");
      } finally {
        setFluxorLoading(false);
      }
    };

    if (bankAddress) {
      fetchFluxorData();
    }
  }, [getTvlApy, bankAddress, selectedDays]); // 添加 selectedDays 依赖
  const chartConfig = (() => {
    switch (activeTab) {
      case "tvl":
        return chartConfigs.tvl;
      case "rates":
        return chartConfigs.rates;
      case "interest-curve":
        return chartConfigs.interestCurve;
      default:
        return chartConfigs.tvl;
    }
  })();
  const chartOptions = (() => {
    switch (activeTab) {
      case "tvl":
        return {
          yAxisLabel: showUSD ? "美元" : bank?.meta.tokenSymbol || "代币",
          tooltipLabel: showUSD ? "美元" : bank?.meta.tokenSymbol || "代币",
          domain: [0, "auto"] as [number, "auto"],
        };
      case "rates":
        return {
          yAxisLabel: "",
          tooltipLabel: "%",
          domain: [0, "auto"] as [number, "auto"],
        };
      case "interest-curve":
        return {
          yAxisLabel: "",
          tooltipLabel: "%",
          domain: [0, 1] as [number, number],
        };
      default:
        return {
          yAxisLabel: "",
          tooltipLabel: "",
          domain: [0, "auto"] as [number, "auto"],
        };
    }
  })();

  const oraclePrice = bank?.info.oraclePrice.priceRealtime.price.toNumber() ?? 0;
  const interestRateConfig = React.useMemo(() => {
    const config = bank?.info.rawBank.config.interestRateConfig;
    if (!config) return null;

    const toNum = (value: { toNumber: () => number } | undefined | null) => value?.toNumber() || 0;

    return {
      optimalUtilizationRate: toNum(config.optimalUtilizationRate),
      plateauInterestRate: toNum(config.plateauInterestRate),
      maxInterestRate: toNum(config.maxInterestRate),
      insuranceFeeFixedApr: toNum(config.insuranceFeeFixedApr),
      insuranceIrFee: toNum(config.insuranceIrFee),
      protocolFixedFeeApr: toNum(config.protocolFixedFeeApr),
      protocolIrFee: toNum(config.protocolIrFee),
    };
  }, [bank]);

  const chartData = React.useMemo(() => {
    if (!fluxorData?.items) {
      return null;
    }

    return fluxorData.items
      .map((item) => {
        const timestampNum = Number(item.timestamp) || 0;
        const timestampMs = timestampNum < 1e12 ? timestampNum * 1000 : timestampNum;
        const totalDeposits = Number(item.totalSupply) || 0;
        const totalBorrows = Number(item.totalBorrow) || 0;
        const totalDepositsUsd = totalDeposits * oraclePrice;
        const totalBorrowsUsd = totalBorrows * oraclePrice;
        const utilization = totalDeposits > 0 ? totalBorrows / totalDeposits : 0;

        return {
          timestamp: new Date(timestampMs).toISOString(),
          borrowRate: Number(item.borrowApy) || 0,
          depositRate: Number(item.supplyApy) || 0,
          totalDeposits,
          totalBorrows,
          totalDepositsUsd,
          totalBorrowsUsd,
          usdPrice: oraclePrice,
          utilization,
          optimalUtilizationRate: interestRateConfig?.optimalUtilizationRate ?? 0,
          plateauInterestRate: interestRateConfig?.plateauInterestRate ?? 0,
          maxInterestRate: interestRateConfig?.maxInterestRate ?? 0,
          insuranceIrFee: interestRateConfig?.insuranceIrFee ?? 0,
          protocolIrFee: interestRateConfig?.protocolIrFee ?? 0,
          insuranceFeeFixedApr: interestRateConfig?.insuranceFeeFixedApr ?? 0,
          protocolFixedFeeApr: interestRateConfig?.protocolFixedFeeApr ?? 0,
          programFeeRate: 0,
          baseRate: 0,
        };
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [fluxorData, oraclePrice, interestRateConfig]);

  const hasError = Boolean(fluxorError) || !chartData || chartData.length === 0;
  const errorMessage = fluxorError || "暂无图表数据";

  const formattedData = React.useMemo(() => {
    return formatChartData(hasError ? null : chartData, showUSD);
  }, [chartData, hasError, showUSD]);

  const interestCurveData = React.useMemo(() => {
    const latestDataPoint = formattedData[formattedData.length - 1];
    return generateInterestCurveData(latestDataPoint);
  }, [formattedData]);

  const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && !hasError) {
      const tooltipLabel =
        activeTab === "interest-curve" ? `利用率 ${(Number(label) * 100).toFixed(0)}%` : formatDate(label);

      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium">{tooltipLabel}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mt-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-muted-foreground">{entry.name}:</span>
              <span className="text-sm font-medium text-foreground">
                {(() => {
                  switch (activeTab) {
                    case "tvl":
                      return showUSD
                        ? `$${dynamicNumeralFormatter(entry.value)}`
                        : `${dynamicNumeralFormatter(entry.value)} ${bank?.meta.tokenSymbol || ""}`;
                  case "rates":
                  case "interest-curve":
                      return `${entry.value.toFixed(2)}%`;
                    default:
                      return entry.value;
                  }
                })()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };
  if (fluxorLoading) {
    return (
      <Card className="w-full bg-background-gray h-[520px] flex flex-col items-center justify-center">
        <CardContent className="flex flex-col items-center justify-center w-full h-full gap-2">
          <IconLoader2 size={16} className="animate-spin" />
          <p className="text-muted-foreground">正在加载图表...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-transparent border-none h-full md:h-[520px]">
      <CardHeader className="sr-only">
        <CardTitle>银行历史数据</CardTitle>
        <CardDescription>展示近 {selectedDays} 天的锁仓规模、利率表现以及利率曲线。</CardDescription>
      </CardHeader>
      <CardContent className="p-3 rounded-lg space-y-4 relative bg-background-gray pt-8">
        <div className="flex w-full flex-col gap-4 px-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col items-start justify-start gap-1 max-w-full sm:max-w-[65%]">
            <h3 className="text-lg">{headerContent[activeTab].title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{headerContent[activeTab].description}</p>
          </div>
          <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
            {activeTab === "tvl" && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">美元</span>
                <Switch
                  checked={showUSD}
                  onCheckedChange={setShowUSD}
                  className="data-[state=unchecked]:bg-background-gray-light"
                  disabled={hasError}
                />
              </div>
            )}
            <ToggleGroup
              type="single"
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as Tabs)}
              className="p-1.5 rounded-md flex flex-wrap gap-1"
              disabled={hasError}
            >
              <ToggleGroupItem
                value="tvl"
                className="text-muted-foreground font-normal h-[1.65rem] data-[state=on]:font-medium data-[state=on]:bg-mfi-action-box-accent data-[state=on]:text-mfi-action-box-accent-foreground hover:bg-mfi-action-box-accent/50 disabled:opacity-50"
              >
                TVL
              </ToggleGroupItem>
              {!isNativeStakeBank && (
                <ToggleGroupItem
                  value="rates"
                  className="text-muted-foreground font-normal h-[1.65rem] data-[state=on]:font-medium data-[state=on]:bg-mfi-action-box-accent data-[state=on]:text-mfi-action-box-accent-foreground hover:bg-mfi-action-box-accent/50 disabled:opacity-50"
                >
                  Rates
                </ToggleGroupItem>
              )}

              <ToggleGroupItem
                value="interest-curve"
                className="text-muted-foreground font-normal h-[1.65rem] data-[state=on]:font-medium data-[state=on]:bg-mfi-action-box-accent data-[state=on]:text-mfi-action-box-accent-foreground hover:bg-mfi-action-box-accent/50 disabled:opacity-50"
              >
                IR Curve
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Error Overlay */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-background-gray/50 rounded-lg">
            <div className="bg-background border border-border rounded-lg p-4 shadow-lg">
              <p className="text-muted-foreground text-center">{errorMessage}</p>
            </div>
          </div>
        )}

        <ChartContainer config={chartConfig} className="lg:h-[420px] w-full">
          <AreaChart
            key={activeTab}
            data={activeTab === "interest-curve" ? interestCurveData : formattedData}
            margin={{
              top: 24,
              right: 24,
              bottom: 6,
              left: 0,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={activeTab === "interest-curve" ? "utilization" : "timestamp"}
              type={activeTab === "interest-curve" ? "number" : undefined}
              domain={activeTab === "interest-curve" ? [0, 1] : undefined}
              tickFormatter={
                activeTab === "interest-curve" ? (value: number) => `${(value * 100).toFixed(0)}%` : formatDate
              }
              ticks={activeTab === "interest-curve" ? [0, 0.2, 0.4, 0.6, 0.8, 1.0] : undefined}
              interval={activeTab === "interest-curve" ? 0 : "preserveStartEnd"}
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              minTickGap={50}
              padding={{ left: 0, right: 0 }}
            />
            <YAxis
              tickFormatter={(value) => {
                if (activeTab === "tvl" && showUSD) {
                  return `$${dynamicNumeralFormatter(value)}`;
                } else if (activeTab === "rates" || activeTab === "interest-curve") {
                  return `${value.toFixed(2)}%`;
                } else {
                  return dynamicNumeralFormatter(value);
                }
              }}
              width={60}
              axisLine={false}
              tickLine={false}
              domain={chartOptions.domain}
              label={{
                value: chartOptions.yAxisLabel,
                angle: -90,
                position: "insideLeft",
                style: { fill: "var(#fffff)" },
              }}
            />
            <ChartTooltip cursor={false} content={<CustomTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} className="mt-6" />
            <defs>
              <linearGradient id="fillPrimary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.2} />
                <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillSecondary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.secondary} stopOpacity={0.2} />
                <stop offset="95%" stopColor={chartColors.secondary} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Only render areas if there's no error */}
            {!hasError &&
              (() => {
                switch (activeTab) {
                  case "tvl":
                    return (
                      <>
                        <Area
                          dataKey="displayTotalDeposits"
                          type="monotone"
                          fill="url(#fillPrimary)"
                          fillOpacity={0.4}
                          stroke={chartColors.primary}
                          strokeWidth={2}
                          name="总存款"
                        />
                        <Area
                          dataKey="displayTotalBorrows"
                          type="monotone"
                          fill="url(#fillSecondary)"
                          fillOpacity={0.4}
                          stroke={chartColors.secondary}
                          strokeWidth={2}
                          name="总借款"
                        />
                      </>
                    );
                  case "rates":
                    return (
                      <>
                        <Area
                          dataKey="depositRate"
                          type="monotone"
                          fill="url(#fillPrimary)"
                          fillOpacity={0.4}
                          stroke={chartColors.primary}
                          strokeWidth={2}
                          name="存款利率"
                        />
                        <Area
                          dataKey="borrowRate"
                          type="monotone"
                          fill="url(#fillSecondary)"
                          fillOpacity={0.4}
                          stroke={chartColors.secondary}
                          strokeWidth={2}
                          name="借款利率"
                        />
                      </>
                    );
                  case "interest-curve": {
                    return (
                      <>
                        <Area
                          dataKey="borrowAPY"
                          data={interestCurveData}
                          type="monotone"
                          fill="url(#fillPrimary)"
                          stroke={chartColors.secondary}
                          strokeWidth={2}
                          name="借款 APY"
                        />
                        <Area
                          dataKey="supplyAPY"
                          data={interestCurveData}
                          type="monotone"
                          fill="url(#fillSecondary)"
                          stroke={chartColors.primary}
                          strokeWidth={2}
                          name="存款 APY"
                        />
                        <ReferenceLine
                          x={currentUtilizationRateDecimal}
                          stroke="#ffffff"
                          strokeDasharray="3 3"
                          label={{
                            value: `当前利用率 ${(currentUtilizationRateDecimal * 100).toFixed(1)}%`,
                            position: "top",
                            fill: "#ffffff",
                            fontSize: 12,
                          }}
                        />
                      </>
                    );
                  }

                  default:
                    return null;
                }
              })()}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export { BankChart2 };
