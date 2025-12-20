import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useProtocolRevenue } from "@mrgnlabs/mrgn-state";
import { numeralFormatter, usdFormatter } from "@mrgnlabs/mrgn-common";
import { cn } from "@mrgnlabs/mrgn-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { IconInfoCircle, IconArrowRight } from "@tabler/icons-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";

function AssetIcon({
  bank,
  className,
}: {
  bank: { tokenLogoUri: string; chainLogoUri: string; tokenSymbol: string };
  className?: string;
}) {
  const tokenIcon = bank.tokenLogoUri;
  const chainIcon = bank.chainLogoUri;

  return (
    <div className={cn("relative size-10 flex-shrink-0", className)}>
      {tokenIcon ? (
        <Image
          src={tokenIcon}
          alt={bank.tokenSymbol}
          fill
          className="rounded-full object-cover"
          sizes="40px"
        />
      ) : (
        <div className="size-10 rounded-full bg-accent flex items-center justify-center text-sm text-foreground">
          {bank.tokenSymbol.slice(0, 1)}
        </div>
      )}
      {chainIcon && (
        <div className="absolute -bottom-1 -right-1 size-4">
          <Image
            src={chainIcon}
            alt={`${bank.tokenSymbol} chain`}
            fill
            className="rounded-full border border-background object-cover"
            sizes="16px"
          />
        </div>
      )}
    </div>
  );
}

export default function RevenuePage() {
  const revenue = useProtocolRevenue();

  const formatUsd = (value: number) => {
    if (value === 0) return "$0.00";
    return usdFormatter.format(value);
  };

  const formatNumber = (value: number) => {
    if (value === 0) return "0";
    return numeralFormatter(value);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-6xl mx-auto w-full px-4 pt-6 space-y-5">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">协议收益</h1>
          <p className="text-sm text-muted-foreground">当前累计收益</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Total Revenue */}
          <Card className="bg-card/70 border border-border/60 shadow-sm">
            <CardContent className="p-4 space-y-1">
              <p className="text-xs text-muted-foreground">总收益</p>
              <p className="text-2xl font-bold text-primary">{formatUsd(revenue.totalRevenue)}</p>
            </CardContent>
          </Card>

          {/* Insurance Fees */}
          <Card className="bg-card/70 border border-border/60 shadow-sm">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-muted-foreground">保险金库费用</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                        <IconInfoCircle size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>当有人破产时，保险金库可以覆盖所有人的损失</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-2xl font-bold text-chartreuse">{formatUsd(revenue.totalInsuranceFees)}</p>
            </CardContent>
          </Card>

          {/* Protocol Fees */}
          <Card className="bg-card/70 border border-border/60 shadow-sm">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-muted-foreground">协议金库费用</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                        <IconInfoCircle size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>协议运营和发展费用</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-2xl font-bold text-success">{formatUsd(revenue.totalProtocolFees)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue by Vault */}
        <Card className="bg-card/70 border border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">金库收益</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              各资金池收取的费用明细
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            {revenue.bankRevenues.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">暂无收益数据</p>
              </div>
            ) : (
              <div className="space-y-3">
                {revenue.bankRevenues.map((bankRevenue) => {
                  const bank = bankRevenue.extendedBankInfo;
                  return (
                    <div
                      key={bank.address.toBase58()}
                      className="rounded-lg border border-border/60 bg-background/40 p-4 hover:bg-accent/20 transition-colors"
                    >
                      {/* Asset Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <AssetIcon bank={bank.meta} />
                        <div className="flex-1">
                          <div className="font-semibold text-base text-primary">{bank.meta.tokenSymbol}</div>
                          <div className="text-xs text-muted-foreground">{bank.meta.tokenName}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-foreground">{formatUsd(bankRevenue.totalFeesUsd)}</div>
                          <div className="text-xs text-muted-foreground">总收益</div>
                        </div>
                      </div>

                      {/* Fee Details */}
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/40">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">保险金库费用</div>
                          <div className="text-base font-semibold text-chartreuse">
                            {formatUsd(bankRevenue.insuranceFeesUsd)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatNumber(bankRevenue.insuranceFeesUi)} {bank.meta.tokenSymbol}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">协议金库费用</div>
                          <div className="text-base font-semibold text-success">
                            {formatUsd(bankRevenue.protocolFeesUsd)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatNumber(bankRevenue.protocolFeesUi)} {bank.meta.tokenSymbol}
                          </div>
                        </div>
                      </div>

                      {/* Detail Button */}
                      <div className="mt-3 pt-3 border-t border-border/40">
                        <Link href={`/banks/${bank.address.toBase58()}`}>
                          <Button
                            variant="outline"
                            // size="sm"
                            className="w-full group hover:bg-accent/50 transition-all"
                          >
                            <span>详情</span>
                            {/* <IconArrowRight
                              size={16}
                              className="ml-2 group-hover:translate-x-1 transition-transform"
                            /> */}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee Explanations */}
        <Card className="bg-card/70 border border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">费用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            <div className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-chartreuse" />
                <h3 className="text-sm font-semibold text-foreground">保险金库费用</h3>
              </div>
              <p className="text-xs text-muted-foreground pl-4.5">
                当有用户因市场波动导致抵押物价值不足而被清算时，如果清算收益无法完全覆盖债务（即发生坏账），保险金库中的资金将用于弥补这部分损失，保护所有存款人的利益。
              </p>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-success" />
                <h3 className="text-sm font-semibold text-foreground">协议金库费用</h3>
              </div>
              <p className="text-xs text-muted-foreground pl-4.5">
                协议金库收取的费用用于支持协议的持续运营、开发和生态系统建设，确保协议能够长期稳定运行并不断改进。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-xs text-muted-foreground space-y-1 pb-2">
          <p>
            更新时间：
            {new Date(revenue.lastUpdate).toLocaleString("zh-CN", {
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </p>
          <p>数据来源：协议金库中已累积的费用，实时从链上读取</p>
        </div>
      </div>
    </div>
  );
}
