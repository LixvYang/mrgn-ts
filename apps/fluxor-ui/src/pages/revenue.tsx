import React from "react";
import { useProtocolRevenue } from "@mrgnlabs/mrgn-state";
import { numeralFormatter, usdFormatter } from "@mrgnlabs/mrgn-common";
import { Loader } from "~/components/ui/loader";

export default function RevenuePage() {
  const revenue = useProtocolRevenue();

  const formatUsd = (value: number) => {
    if (value === 0) return "$0.00";
    return usdFormatter.format(value);
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    if (value === 0) return "0";
    return numeralFormatter(value);
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full h-full justify-start items-center px-4 mb-20">
      <div className="w-full space-y-8 mt-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary">Protocol Revenue</h1>
          <p className="text-muted-foreground">
            Total accumulated fees collected by the protocol
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Revenue */}
          <div className="bg-accent/50 rounded-lg p-6 border border-border">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold text-primary">
                {formatUsd(revenue.totalRevenue)}
              </p>
            </div>
          </div>

          {/* Insurance Fees */}
          <div className="bg-accent/50 rounded-lg p-6 border border-border">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Insurance Fees</p>
              <p className="text-3xl font-bold text-blue-500">
                {formatUsd(revenue.totalInsuranceFees)}
              </p>
              <p className="text-xs text-muted-foreground">
                {((revenue.totalInsuranceFees / revenue.totalRevenue) * 100 || 0).toFixed(1)}% of total
              </p>
            </div>
          </div>

          {/* Protocol Fees */}
          <div className="bg-accent/50 rounded-lg p-6 border border-border">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Protocol Fees</p>
              <p className="text-3xl font-bold text-green-500">
                {formatUsd(revenue.totalProtocolFees)}
              </p>
              <p className="text-xs text-muted-foreground">
                {((revenue.totalProtocolFees / revenue.totalRevenue) * 100 || 0).toFixed(1)}% of total
              </p>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown by Bank */}
        <div className="bg-background rounded-lg border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-2xl font-bold">Revenue by Asset</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Detailed breakdown of fees collected across all pools
            </p>
          </div>

          {revenue.bankRevenues.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No revenue data available yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent/30">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="p-4 font-medium">Asset</th>
                    <th className="p-4 font-medium text-right">Insurance Fees</th>
                    <th className="p-4 font-medium text-right">Protocol Fees</th>
                    <th className="p-4 font-medium text-right">Total (USD)</th>
                    <th className="p-4 font-medium text-right">% of Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {revenue.bankRevenues.map((bank) => (
                    <tr key={bank.bankAddress} className="hover:bg-accent/20 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-primary">{bank.tokenSymbol}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {bank.bankAddress.slice(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-blue-500 font-medium">
                            {formatUsd(bank.insuranceFeesUsd)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatNumber(bank.insuranceFeesUi)} {bank.tokenSymbol}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-green-500 font-medium">
                            {formatUsd(bank.protocolFeesUsd)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatNumber(bank.protocolFeesUi)} {bank.tokenSymbol}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold text-primary">
                          {formatUsd(bank.totalFeesUsd)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 h-2 bg-accent rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${(bank.totalFeesUsd / revenue.totalRevenue) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium min-w-[3rem]">
                            {((bank.totalFeesUsd / revenue.totalRevenue) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Last updated: {new Date(revenue.lastUpdate).toLocaleString()}
          </p>
          <p className="mt-1">
            Revenue represents accumulated fees collected by the protocol vaults
          </p>
        </div>
      </div>
    </div>
  );
}
