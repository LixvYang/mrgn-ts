import React from "react";

import { getPriceWithConfidence } from "@mrgnlabs/marginfi-client-v2";
import { nativeToUi } from "@mrgnlabs/mrgn-common";

import { useExtendedBanks } from "./use-extended-banks";
import { ExtendedBankInfo } from "../../types";

export interface BankRevenue {
  // Extended bank info for easy access
  extendedBankInfo: ExtendedBankInfo;

  // Insurance fees
  insuranceFeesNative: number;
  insuranceFeesUi: number;
  insuranceFeesUsd: number;

  // Protocol fees
  protocolFeesNative: number;
  protocolFeesUi: number;
  protocolFeesUsd: number;

  // Total for this bank
  totalFeesUsd: number;

  // Price info
  price: number;
}

export interface ProtocolRevenue {
  // Accumulated fees (already collected)
  totalInsuranceFees: number;
  totalProtocolFees: number;
  totalRevenue: number;

  // Breakdown by bank
  bankRevenues: BankRevenue[];

  // Last update timestamp
  lastUpdate: number;
}

export function useProtocolRevenue() {
  const { extendedBanks } = useExtendedBanks();

  const revenue = React.useMemo((): ProtocolRevenue => {
    if (!extendedBanks || extendedBanks.length === 0) {
      return {
        totalInsuranceFees: 0,
        totalProtocolFees: 0,
        totalRevenue: 0,
        bankRevenues: [],
        lastUpdate: Date.now(),
      };
    }

    let totalInsuranceFees = 0;
    let totalProtocolFees = 0;

    const bankRevenues: BankRevenue[] = extendedBanks
      .map((bank) => {
        const oraclePrice = bank.info.oraclePrice;
        const price = oraclePrice ? getPriceWithConfidence(oraclePrice, false).price.toNumber() : 0;

        // Get insurance fees
        const insuranceFeesNative = bank.info.rawBank.collectedInsuranceFeesOutstanding.toNumber();
        const insuranceFeesUi = nativeToUi(insuranceFeesNative, bank.info.state.mintDecimals);
        const insuranceFeesUsd = insuranceFeesUi * price;

        // Get protocol fees (group fees)
        const protocolFeesNative = bank.info.rawBank.collectedGroupFeesOutstanding.toNumber();
        const protocolFeesUi = nativeToUi(protocolFeesNative, bank.info.state.mintDecimals);
        const protocolFeesUsd = protocolFeesUi * price;

        // Calculate total
        const totalFeesUsd = insuranceFeesUsd + protocolFeesUsd;

        // Accumulate totals
        totalInsuranceFees += insuranceFeesUsd;
        totalProtocolFees += protocolFeesUsd;

        return {
          extendedBankInfo: bank,
          insuranceFeesNative,
          insuranceFeesUi,
          insuranceFeesUsd,
          protocolFeesNative,
          protocolFeesUi,
          protocolFeesUsd,
          totalFeesUsd,
          price,
        };
      })
      // Filter out banks with zero fees
      .filter((bank) => bank.totalFeesUsd > 0)
      // Sort by total fees descending
      .sort((a, b) => b.totalFeesUsd - a.totalFeesUsd);

    return {
      totalInsuranceFees,
      totalProtocolFees,
      totalRevenue: totalInsuranceFees + totalProtocolFees,
      bankRevenues,
      lastUpdate: Date.now(),
    };
  }, [extendedBanks]);

  return revenue;
}
