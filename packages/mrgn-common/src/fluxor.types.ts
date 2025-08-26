export interface FluxorBankTvlApyResponse {
  items: { timestamp: number; supplyApy: string; borrowApy: string; totalSupply: string; totalBorrow: string }[];
}

export interface FluxorGlobalStatisticsResponse {
  tvl: string;
  totalSupply: string;
  totalBorrow: string;
  supplyItems: {
    bankAsset: FluxorBankAsset;
    supply?: string;
    borrow?:string;
    ratio: string;
  }[];
  borrowItems: {
    bankAsset: FluxorBankAsset;
    borrow?: string;
    supply?: string;
    ratio: string;
  }[];
}

export interface FluxorBankAsset {
  assetId: string;
  chainId: string;
  priceUsd: string;
  symbol: string;
  name: string;
  iconUrl: string;
}

export interface CallComputerRequest {
  computerId: string;
  mixAddress: string;
  chainAddress: string;
  mixinUserId: string;
  traceId: string;
  extra: {
    groupAddress: string;
    bankAddress1: string;
    type: string;
    inputAmount: string;
  };
}
