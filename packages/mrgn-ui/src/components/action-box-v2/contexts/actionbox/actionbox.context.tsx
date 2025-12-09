import React from "react";
import { WalletContextState } from "@solana/wallet-adapter-react";

import { ExtendedBankInfo, AccountSummary, StakePoolMetadata } from "@mrgnlabs/mrgn-state";
import { MarginfiAccountWrapper, MarginfiClient, ValidatorStakeGroup } from "@mrgnlabs/marginfi-client-v2";

import { WalletContextStateOverride } from "~/components/wallet-v2";
import { ComputerInfoResponse, ComputerUserResponse, UserAssetBalance } from "@mrgnlabs/mrgn-common";
import { Connection } from "@solana/web3.js";
import { SequencerTransactionRequest, UserResponse } from "@mixin.dev/mixin-node-sdk";

export type HidePoolStats = Array<"amount" | "health" | "size" | "type" | "oracle" | "liquidation">;

type ActionBoxContextType = {
  banks: ExtendedBankInfo[];
  nativeSolBalance: number;
  connected: boolean; // ✅ 用户已完全连接 (Mixin 登录 + 金融云注册)
  marginfiClient: MarginfiClient | null;
  selectedAccount: MarginfiAccountWrapper | null;
  walletContextState?: WalletContextStateOverride | WalletContextState;
  accountSummaryArg?: AccountSummary;
  hidePoolStats?: HidePoolStats;
  stakePoolMetadataMap?: Map<string, StakePoolMetadata>;
  stakeAccounts?: ValidatorStakeGroup[];
  setDisplaySettings?: (displaySettings: boolean) => void;

  // Mixin 相关状态
  getUserMix?: () => string;
  computerInfo?: ComputerInfoResponse;
  connection?: Connection;
  computerAccount?: ComputerUserResponse;
  getComputerRecipient?: () => string;
  balanceAddressMap?: Record<string, UserAssetBalance>;
  fetchTransaction?: (transactionId: string) => Promise<SequencerTransactionRequest>;
  refreshMixinBalances?: () => Promise<void>;
  mixinUser?: UserResponse | undefined;

  // ✅ 新增: Mixin 注册状态
  mixinConnected?: boolean; // Mixin 登录状态 (true = 已登录 Mixin)
  mixinRegistered?: boolean; // 金融云注册状态 (true = 已注册金融云)
};

const ActionBoxContext = React.createContext<ActionBoxContextType | null>(null);

export const ActionBoxProvider: React.FC<ActionBoxContextType & { children: React.ReactNode }> = ({
  children,
  ...props
}) => {
  return <ActionBoxContext.Provider value={props}>{children}</ActionBoxContext.Provider>;
};

export const useActionBoxContext = () => {
  const context = React.useContext(ActionBoxContext);
  return context;
};
