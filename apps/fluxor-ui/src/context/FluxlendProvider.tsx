/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { useRouter } from "next/router";
import { identify } from "@mrgnlabs/mrgn-utils";

import { ActionBoxProvider, AuthDialog, useWallet } from "@mrgnlabs/mrgn-ui";
import { useUiStore } from "~/store";
import {
  fetchMarginfiAccount,
  fetchMarginfiAccountAddresses,
  initializeMixinVars,
  resetMixinBalanceAddressMap,
  resetMixinState,
  setMixin,
  useExtendedBanks,
  useMarginfiAccount,
  useMarginfiAccountAddresses,
  useMarginfiClient,
  useMetadata,
  useNativeStakeData,
  useOracleData,
  useRawBanks,
  useRefreshUserData,
  useSelectedAccount,
  useUserBalances,
  useUserStakeAccounts,
  useWrappedMarginfiAccount,
  WalletStateProvider,
} from "@mrgnlabs/mrgn-state";
import { useComputerStore } from "@mrgnlabs/fluxor-state";
import { PublicKey } from "@solana/web3.js";
import { Wallet } from "@mrgnlabs/mrgn-common";
import { MarginfiAccount, MarginfiAccountType, MarginfiAccountWrapper } from "@mrgnlabs/marginfi-client-v2";
import { useConnection } from "@mrgnlabs/mrgn-utils";

export const FluxlendProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  setMixin(true);
  const router = useRouter();
  const refreshUserData = useRefreshUserData();
  const {
    connected,
    register,
    updateBalances,
    computerAssets,
    getPublicKey,
    balanceAddressMap,
    publicKey: storePublicKey,
    getUserMix,
    info: computerInfo,
    account: computerAccount,
    getComputerRecipient,
  } = useComputerStore();
  const { connection } = useConnection();

  const [walletAddress, setWalletAddress] = React.useState<PublicKey>(PublicKey.default);
  const [wallet, setWallet] = React.useState<Wallet>({
    publicKey: PublicKey.default,
    signTransaction: () => new Promise(() => {}),
    signAllTransactions: () => new Promise(() => {}),
  });
  // const { wallet, walletAddress } = useWallet();

  // 使用 useEffect 处理钱包状态更新
  React.useEffect(() => {
    // console.log("🔄 FluxlendProvider useEffect: connected:", connected, "register:", register);

    resetMixinState(connected, register);
    if (connected && register) {
      const publicKey = getPublicKey();
      if (publicKey && !publicKey.equals(PublicKey.default)) {
        // console.log("🔄 Setting wallet address from getPublicKey:", publicKey.toBase58());

        // 只在地址真正变化时才更新状态
        if (!walletAddress.equals(publicKey)) {
          setWalletAddress(publicKey);
        }

        // 只在钱包对象需要更新时才设置
        if (!wallet.publicKey.equals(publicKey)) {
          setWallet({
            publicKey,
            signTransaction: () => new Promise(() => {}),
            signAllTransactions: () => new Promise(() => {}),
          });
        }
      }
    } else if (!connected && !register) {
      const defaultKey = PublicKey.default;
      // console.log("🔄 Setting default wallet address (not connected, not registered)");

      // 只在需要重置时才更新
      if (!walletAddress.equals(defaultKey)) {
        setWalletAddress(defaultKey);
      }

      if (!wallet.publicKey.equals(defaultKey)) {
        setWallet({
          publicKey: defaultKey,
          signTransaction: () => new Promise(() => {}),
          signAllTransactions: () => new Promise(() => {}),
        });
      }
    } else if (connected && !register) {
      const defaultKey = PublicKey.default;
      // console.log("🔄 Setting default wallet address (connected but not registered)");

      // 只在需要重置时才更新
      if (!walletAddress.equals(defaultKey)) {
        setWalletAddress(defaultKey);
      }

      if (!wallet.publicKey.equals(defaultKey)) {
        setWallet({
          publicKey: defaultKey,
          signTransaction: () => new Promise(() => {}),
          signAllTransactions: () => new Promise(() => {}),
        });
      }
    }
  }, [connected, register, storePublicKey]); // 只监听关键状态变化

  // 单独处理 balanceAddressMap 的更新
  React.useEffect(() => {
    if (connected && register) {
      resetMixinBalanceAddressMap(balanceAddressMap);
    } else if (connected && !register) {
      resetMixinBalanceAddressMap(balanceAddressMap);
    } else {
      resetMixinBalanceAddressMap({});
    }
  }, [balanceAddressMap]);

  const { extendedBanks } = useExtendedBanks();
  const { stakePoolMetadataMap } = useNativeStakeData();

  const { wrappedAccount: selectedAccount } = useWrappedMarginfiAccount(wallet);
  // const [selectedAccount, setSelectedAccount] = React.useState<MarginfiAccountWrapper | null>(null);

  const {
    data: marginfiAccounts,
    isLoading: isLoadingMarginfiAccounts,
    isSuccess: isSuccessMarginfiAccounts,
    refetch: refetchMarginfiAccountAddresses,
  } = useMarginfiAccountAddresses();
  const { refetch: refetchMarginfiAccount } = useMarginfiAccount();
  const { data: userBalances, refetch: refetchUserBalances } = useUserBalances();
  const { data: stakeAccounts } = useUserStakeAccounts();
  const { marginfiClient } = useMarginfiClient(wallet);
  const { selectedAccountKey, setSelectedAccountKey } = useSelectedAccount();

  const [fetchPriorityFee, fetchAccountLabels, accountLabels, setDisplaySettings] = useUiStore((state) => [
    state.fetchPriorityFee,
    state.fetchAccountLabels,
    state.accountLabels,
    state.setDisplaySettings,
  ]);

  const [hasFetchedAccountLabels, setHasFetchedAccountLabels] = React.useState(false);

  React.useEffect(() => {
    const fetchMarginfiAccounts = async () => {
      if (connected && register && walletAddress) {
        // console.log("🔄 FluxlendProvider useEffect: refetchMarginfiAccountAddresses");
        refetchMarginfiAccountAddresses();
        const marginfiAccounts = await fetchMarginfiAccountAddresses(walletAddress);
        console.log("marginfiAccounts: ", marginfiAccounts);
        if (marginfiAccounts.length > 0) {
          setSelectedAccountKey(marginfiAccounts[0].toBase58()); // 设置第一个账户
          // refetchMarginfiAccount(); // 刷新 marginfiAccount
          refreshUserData({ newAccountKey: new PublicKey(marginfiAccounts[0].toBase58()) }); // 刷新用户数据
          // // refreshUserData(); // 刷新 wrappedAccount

          // if (!rawBanks || !oracleData?.pythFeedIdMap || !oracleData?.oracleMap || !metadata?.bankMetadataMap) {
          //   throw new Error("Required data not available for fetching MarginFi account");
          // }

          // const result = await fetchMarginfiAccount(
          //   rawBanks,
          //   oracleData.pythFeedIdMap,
          //   oracleData.oracleMap,
          //   metadata.bankMetadataMap,
          //   walletAddress ? new PublicKey(walletAddress) : undefined,
          //   selectedAccountKey ? new PublicKey(selectedAccountKey) : undefined
          // );
          // if (result && marginfiClient) {
          //   setSelectedAccount(
          //     new MarginfiAccountWrapper(result.address, marginfiClient, MarginfiAccount.fromAccountType(result))
          //   );
          // }
        }
      }
    };
    fetchMarginfiAccounts();
  }, [connected, register, walletAddress, refetchMarginfiAccountAddresses]); // eslint-disable-line react-hooks/exhaustive-deps

  // 处理余额更新
  React.useEffect(() => {
    if (connected && computerAssets.length > 0) {
      updateBalances(computerAssets);
    }
  }, [connected, computerAssets.length]); // 依赖连接状态和资产数量

  // 初始化 Mixin 变量
  // React.useEffect(() => {
  //   if (Object.keys(balanceAddressMap).length > 0) {
  //     initializeMixinVars({ balanceAddressMap, publicKey: walletAddress });
  //   }
  // }, [balanceAddressMap, walletAddress]); // 只依赖 balanceAddressMap

  // identify user if logged in
  React.useEffect(() => {
    const walletAddressStr = walletAddress?.toBase58();
    if (!walletAddressStr || walletAddress.equals(PublicKey.default)) return;
    identify(walletAddressStr, {
      wallet: walletAddressStr,
    });
  }, [walletAddress]);

  // if account set in query param then store inn local storage and remove from url
  React.useEffect(() => {
    const { account } = router.query;
    if (!account) return;

    const prevMfiAccount = localStorage.getItem("mfiAccount");
    if (prevMfiAccount === account) return;

    localStorage.setItem("mfiAccount", account as string);
    router.replace(router.pathname, undefined, { shallow: true });
  }, [router.query]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch account labels
  React.useEffect(() => {
    if (marginfiAccounts && marginfiAccounts.length > 0 && isSuccessMarginfiAccounts) {
      setHasFetchedAccountLabels(true);
      fetchAccountLabels(marginfiAccounts);
    }
  }, [marginfiAccounts, isSuccessMarginfiAccounts, fetchAccountLabels]);

  return (
    <WalletStateProvider walletAddress={walletAddress} wallet={wallet}>
      <ActionBoxProvider
        banks={extendedBanks}
        nativeSolBalance={userBalances?.nativeSolBalance ?? 0}
        marginfiClient={marginfiClient ?? null}
        selectedAccount={selectedAccount}
        connected={false}
        setDisplaySettings={setDisplaySettings}
        stakePoolMetadataMap={stakePoolMetadataMap}
        stakeAccounts={stakeAccounts ?? []}
        getUserMix={getUserMix}
        computerInfo={computerInfo}
        connection={connection}
        computerAccount={computerAccount}
        getComputerRecipient={getComputerRecipient}
        balanceAddressMap={balanceAddressMap}
      >
        {children}

        <AuthDialog
          mrgnState={{
            marginfiClient: marginfiClient ?? null,
            selectedAccount,
            extendedBankInfos: extendedBanks,
            nativeSolBalance: userBalances?.nativeSolBalance ?? 0,
          }}
        />
      </ActionBoxProvider>
    </WalletStateProvider>
  );
};
