export type BankChartData = {
  borrowRate: number;
  depositRate: number;
  timestamp: string;
  totalBorrows: number;
  totalDeposits: number;
  totalBorrowsUsd?: number;
  totalDepositsUsd?: number;
  usdPrice: number;
  utilization: number;
  optimalUtilizationRate: number;
  baseRate: number;
  plateauInterestRate: number;
  maxInterestRate: number;
  insuranceIrFee: number;
  protocolIrFee: number;
  programFeeRate: number;
  insuranceFeeFixedApr: number;
  protocolFixedFeeApr: number;
};

export type BankHistoricalDataResponse = {
  data: BankChartData[];
};

export type BankChartDataDailyAverages = BankChartData & {
  timestamp: string;
};

export type UseBankRatesReturn = {
  data: BankChartDataDailyAverages[] | null;
  error: Error | null;
  isLoading: boolean;
};

export const chartColors = {
  primary: "hsl(var(--mrgn-success))",
  secondary: "hsl(var(--mrgn-warning))",
} as const;

export const chartConfigs = {
  rates: {
    depositRate: {
      label: "存款利率",
      color: chartColors.primary,
    },
    borrowRate: {
      label: "借款利率",
      color: chartColors.secondary,
    },
  },
  interestCurve: {
    borrowAPY: {
      label: "借款 APY",
      color: chartColors.secondary,
    },
    supplyAPY: {
      label: "存款 APY",
      color: chartColors.primary,
    },
  },
  tvl: {
    displayTotalDeposits: {
      label: "总存款",
      color: chartColors.primary,
    },
    displayTotalBorrows: {
      label: "总借款",
      color: chartColors.secondary,
    },
  },
};
