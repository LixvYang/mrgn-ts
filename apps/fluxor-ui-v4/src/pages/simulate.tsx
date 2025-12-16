import React from "react";
import Image from "next/image";

import { MarginRequirementType, OperationalState } from "@mrgnlabs/marginfi-client-v2";
import { usdFormatter } from "@mrgnlabs/mrgn-common";
import { cn } from "@mrgnlabs/mrgn-utils";
import { ExtendedBankInfo, useExtendedBanks } from "@mrgnlabs/mrgn-state";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";

import { IconInfoCircle } from "@tabler/icons-react";

const usdPriceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 6,
});

const tokenAmountFormatter = new Intl.NumberFormat("en-US", {
  useGrouping: true,
  minimumFractionDigits: 0,
  maximumFractionDigits: 6,
});

function AssetIcon({ bank, className }: { bank: ExtendedBankInfo; className?: string }) {
  const tokenIcon = bank.meta.tokenLogoUri;
  const chainIcon = bank.meta.chainLogoUri;

  return (
    <div className={cn("relative size-6 flex-shrink-0", className)}>
      {tokenIcon ? (
        <Image
          src={tokenIcon}
          alt={bank.meta.tokenSymbol}
          fill
          className="rounded-full object-cover"
          sizes="24px"
        />
      ) : (
        <div className="size-6 rounded-full bg-accent flex items-center justify-center text-xs text-foreground">
          {bank.meta.tokenSymbol.slice(0, 1)}
        </div>
      )}
      {chainIcon && (
        <div className="absolute -bottom-1 -right-1 size-3">
          <Image
            src={chainIcon}
            alt={`${bank.meta.tokenSymbol} chain`}
            fill
            className="rounded-full border border-background object-cover"
            sizes="12px"
          />
        </div>
      )}
    </div>
  );
}

function AssetOption({
  bank,
  showName = false,
}: {
  bank: ExtendedBankInfo;
  showName?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <AssetIcon bank={bank} />
      <div className="min-w-0">
        <div className="text-sm text-foreground truncate leading-5">{bank.meta.tokenSymbol}</div>
        {showName && <div className="text-[11px] text-muted-foreground truncate">{bank.meta.tokenName}</div>}
      </div>
    </div>
  );
}

function safeParseNumber(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

export default function SimulatePage() {
  const { extendedBanks } = useExtendedBanks();

  const banks = React.useMemo(() => {
    return [...extendedBanks].sort((a, b) => a.meta.tokenSymbol.localeCompare(b.meta.tokenSymbol));
  }, [extendedBanks]);

  const collateralCandidates = React.useMemo(() => {
    return banks.filter((b) => b.info.rawBank.config.operationalState !== OperationalState.ReduceOnly);
  }, [banks]);

  const borrowCandidates = React.useMemo(() => {
    return banks.filter((b) => b.info.rawBank.config.operationalState !== OperationalState.ReduceOnly);
  }, [banks]);

  const defaultCollateralBankAddress = React.useMemo(() => {
    const xin = collateralCandidates.find((b) => b.meta.tokenSymbol === "XIN");
    return xin?.address.toBase58() ?? collateralCandidates[0]?.address.toBase58() ?? "";
  }, [collateralCandidates]);

  const defaultBorrowBankAddress = React.useMemo(() => {
    const preferred = ["USDT", "USDC", "SOL"];
    for (const symbol of preferred) {
      const match = borrowCandidates.find((b) => b.meta.tokenSymbol === symbol);
      if (match) return match.address.toBase58();
    }
    return (
      borrowCandidates.find((b) => b.address.toBase58() !== defaultCollateralBankAddress)?.address.toBase58() ?? ""
    );
  }, [borrowCandidates, defaultCollateralBankAddress]);

  const [collateralBankAddress, setCollateralBankAddress] = React.useState("");
  const [collateralAmountInput, setCollateralAmountInput] = React.useState("1");
  const [borrowBankAddress, setBorrowBankAddress] = React.useState("");
  const [borrowRatio, setBorrowRatio] = React.useState(50);

  React.useEffect(() => {
    if (!collateralBankAddress && defaultCollateralBankAddress) {
      setCollateralBankAddress(defaultCollateralBankAddress);
    }
  }, [collateralBankAddress, defaultCollateralBankAddress]);

  React.useEffect(() => {
    if (!borrowBankAddress && defaultBorrowBankAddress) {
      setBorrowBankAddress(defaultBorrowBankAddress);
    }
  }, [borrowBankAddress, defaultBorrowBankAddress]);

  React.useEffect(() => {
    if (!collateralBankAddress) return;
    const stillValid = collateralCandidates.some((b) => b.address.toBase58() === collateralBankAddress);
    if (!stillValid) setCollateralBankAddress(defaultCollateralBankAddress);
  }, [collateralBankAddress, collateralCandidates, defaultCollateralBankAddress]);

  React.useEffect(() => {
    if (!borrowBankAddress) return;
    const stillValid = borrowCandidates.some((b) => b.address.toBase58() === borrowBankAddress);
    if (!stillValid) setBorrowBankAddress(defaultBorrowBankAddress);
  }, [borrowBankAddress, borrowCandidates, defaultBorrowBankAddress]);

  const collateralBank = React.useMemo(() => {
    if (!collateralBankAddress) return undefined;
    return banks.find((b) => b.address.toBase58() === collateralBankAddress);
  }, [banks, collateralBankAddress]);

  const borrowBank = React.useMemo(() => {
    if (!borrowBankAddress) return undefined;
    return banks.find((b) => b.address.toBase58() === borrowBankAddress);
  }, [banks, borrowBankAddress]);

  const collateralAmount = React.useMemo(() => safeParseNumber(collateralAmountInput), [collateralAmountInput]);

  const collateralPriceUsd = collateralBank?.info.oraclePrice.priceRealtime.price.toNumber() ?? 0;
  const borrowPriceUsd = borrowBank?.info.oraclePrice.priceRealtime.price.toNumber() ?? 0;

  const collateralWeight = React.useMemo(() => {
    if (!collateralBank?.info?.rawBank?.getAssetWeight) return 0;
    const weight = collateralBank.info.rawBank
      .getAssetWeight(MarginRequirementType.Initial, collateralBank.info.oraclePrice)
      .toNumber();
    return weight > 0 ? weight : 0;
  }, [collateralBank]);

  const debtLtv = React.useMemo(() => {
    const liabilityWeight = borrowBank?.info?.rawBank?.config?.liabilityWeightInit?.toNumber?.() ?? 0;
    if (!liabilityWeight || liabilityWeight <= 0) return 0;
    return 1 / liabilityWeight;
  }, [borrowBank]);

  const collateralUsd = collateralAmount * collateralPriceUsd;
  const weightedCollateralUsd = collateralUsd * collateralWeight;

  const maxBorrowUsd = weightedCollateralUsd * debtLtv;
  const maxBorrowAmount = borrowPriceUsd > 0 ? maxBorrowUsd / borrowPriceUsd : 0;

  const ratio = Math.min(100, Math.max(0, borrowRatio)) / 100;
  const borrowUsd = maxBorrowUsd * ratio;
  const borrowAmount = maxBorrowAmount * ratio;

  const isReady = banks.length > 0 && collateralBank && borrowBank;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-5xl mx-auto w-full px-4 pt-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">模拟</h1>
          <p className="text-sm text-muted-foreground">
            通过“资产权重（Collateral Weight）”与“债务 LTV（1 / Liability Weight）”直观看到最多能借多少。
          </p>
        </div>

        <Card className="bg-card/70 border border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">输入</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              选择抵押资产与数量，再选择要借入的资产（Reduce Only 资产不支持新增抵押/借入，已隐藏）。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!banks.length ? (
              <div className="text-sm text-muted-foreground">正在加载资产列表…</div>
            ) : !collateralCandidates.length || !borrowCandidates.length ? (
              <div className="text-sm text-muted-foreground">当前没有可用于模拟的资产（已过滤 Reduce Only）。</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">抵押（Lend in）</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <IconInfoCircle size={16} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>抵押价值会按“资产权重”折算成可用抵押额度。</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <Select value={collateralBankAddress} onValueChange={setCollateralBankAddress}>
                          <SelectTrigger>
                            {collateralBank ? <AssetOption bank={collateralBank} /> : <SelectValue placeholder="选择资产" />}
                          </SelectTrigger>
                          <SelectContent>
                            {collateralCandidates.map((bank) => (
                              <SelectItem
                                key={bank.address.toBase58()}
                                value={bank.address.toBase58()}
                                textValue={`${bank.meta.tokenSymbol} ${bank.meta.tokenName}`}
                              >
                                <AssetOption bank={bank} showName />
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        inputMode="decimal"
                        value={collateralAmountInput}
                        onChange={(e) => setCollateralAmountInput(e.target.value)}
                        placeholder="数量"
                        className="text-right"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">借入（Borrow in）</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <IconInfoCircle size={16} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>不同债务资产的“LTV”不同，会影响同样抵押下可借的上限。</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select value={borrowBankAddress} onValueChange={setBorrowBankAddress}>
                      <SelectTrigger>
                        {borrowBank ? <AssetOption bank={borrowBank} /> : <SelectValue placeholder="选择资产" />}
                      </SelectTrigger>
                      <SelectContent>
                        {borrowCandidates.map((bank) => (
                          <SelectItem
                            key={bank.address.toBase58()}
                            value={bank.address.toBase58()}
                            textValue={`${bank.meta.tokenSymbol} ${bank.meta.tokenName}`}
                          >
                            <AssetOption bank={bank} showName />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">借款比例</span>
                    <span className="text-sm text-muted-foreground">{borrowRatio}%</span>
                  </div>
                  <Slider
                    value={[borrowRatio]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(v) => setBorrowRatio(v[0] ?? 0)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {[25, 50, 75, 100].map((pct) => (
                      <Button
                        key={pct}
                        type="button"
                        variant={borrowRatio === pct ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setBorrowRatio(pct)}
                      >
                        {pct}%
                      </Button>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => setBorrowRatio(0)}>
                      清零
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/70 border border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">结果</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              最大可借（USD）= 抵押价值 × 资产权重 × 债务 LTV
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isReady ? (
              <div className="text-sm text-muted-foreground">请选择资产后查看结果。</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-1">
                    <div className="text-xs text-muted-foreground">抵押价值</div>
                    <div className="text-lg font-semibold text-foreground">{usdFormatter.format(collateralUsd)}</div>
                    <div className="text-xs text-muted-foreground">
                      {collateralBank?.meta.tokenSymbol} 价格 ≈ {usdPriceFormatter.format(collateralPriceUsd)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-1">
                    <div className="text-xs text-muted-foreground">折算后抵押（按资产权重）</div>
                    <div className="text-lg font-semibold text-foreground">
                      {usdFormatter.format(weightedCollateralUsd)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      资产权重（Initial）≈ {collateralWeight.toFixed(3)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-1">
                    <div className="text-xs text-muted-foreground">债务 LTV（1 / Liability Weight）</div>
                    <div className="text-lg font-semibold text-foreground">{debtLtv.toFixed(3)}</div>
                    <div className="text-xs text-muted-foreground">
                      {borrowBank?.meta.tokenSymbol} 价格 ≈ {usdPriceFormatter.format(borrowPriceUsd)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-1">
                    <div className="text-xs text-muted-foreground">最多可借（100%）</div>
                    <div className="text-lg font-semibold text-foreground">
                      {borrowBank?.meta.tokenSymbol} {tokenAmountFormatter.format(maxBorrowAmount)}
                    </div>
                    <div className="text-xs text-muted-foreground">{usdFormatter.format(maxBorrowUsd)}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-foreground">按当前比例借入</div>
                    <div className="text-sm text-muted-foreground">
                      {borrowBank?.meta.tokenSymbol} {tokenAmountFormatter.format(borrowAmount)}（{usdFormatter.format(borrowUsd)}）
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    抵押 {collateralBank?.meta.tokenSymbol} {collateralAmountInput || "0"} →
                    可借上限 {borrowBank?.meta.tokenSymbol} {tokenAmountFormatter.format(maxBorrowAmount)}（由权重与 LTV 决定）
                  </div>
                  <div className={cn("text-xs", borrowRatio >= 90 ? "text-warning" : "text-muted-foreground")}>
                    提示：100% 代表刚好触及初始保证金边界，实际操作建议留出安全余量。
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
