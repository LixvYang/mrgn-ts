/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { useRouter } from "next/router";
import { identify } from "@mrgnlabs/mrgn-utils";

import { ActionBoxProvider, AuthDialog, useWallet } from "@mrgnlabs/mrgn-ui";
import { useUiStore } from "~/store";
import {
  fetchMarginfiAccount,
  fetchMarginfiAccountAddresses,
  getConfig,
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
import { toastManager } from "@mrgnlabs/mrgn-toasts";
import { MixinRegisterGuard } from "~/components/common/MixinWallet/components/MixinRegisterGuard";

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
    getMixinClient,
    user: mixinUser,
    sessionExpired,
    setSessionExpired,
  } = useComputerStore();
  const { connection } = useConnection();

  const [walletAddress, setWalletAddress] = React.useState<PublicKey>(PublicKey.default);
  const [wallet, setWallet] = React.useState<Wallet>({
    publicKey: PublicKey.default,
    signTransaction: () => new Promise(() => {}),
    signAllTransactions: () => new Promise(() => {}),
  });
  // const { wallet, walletAddress } = useWallet();

  React.useEffect(() => {
    if (sessionExpired) {
      toastManager.showErrorToast("Mixin session expired. Please reconnect your wallet.");
      setSessionExpired(false);
    }
  }, [sessionExpired, setSessionExpired]);

  // 使用 useEffect 处理钱包状态更新
  React.useEffect(() => {
    // console.log("🔄 FluxlendProvider useEffect: connected:", connected, "register:", register);

    resetMixinState(connected, register);
    if (connected && register) {
      const publicKey = getPublicKey();
      console.log("mixin publicKey", { publicKey: publicKey?.toBase58() });
      console.log("walletAddress", { walletAddress: walletAddress.toBase58() });

      // console.log("publicKey.equals(PublicKey.default): ", publicKey.equals(PublicKey.default));
      if (publicKey && !publicKey.equals(PublicKey.default)) {
        console.log("设置前的 walletAddress:", {
          old: walletAddress.toBase58(),
          new: publicKey.toBase58(),
        });

        // 只在地址真正变化时才更新状态
        if (!walletAddress.equals(publicKey)) {
          setWalletAddress(publicKey);
          console.log("状态已更新，新地址将在下次渲染时生效:", publicKey.toBase58());

          // 立即处理新地址，不等待状态更新
          (async () => {
            try {
              console.log("立即处理新地址:", { newAddress: publicKey.toBase58() });
              refetchMarginfiAccountAddresses();
              const marginfiAccounts = await fetchMarginfiAccountAddresses(publicKey);
              console.log("marginfiAccounts: ", marginfiAccounts);

              if (marginfiAccounts.length > 0) {
                setSelectedAccountKey(marginfiAccounts[0].toBase58());
                refreshUserData({ newAccountKey: new PublicKey(marginfiAccounts[0].toBase58()) });
              }
            } catch (error) {
              console.error("处理钱包地址更新时出错:", error);
            }
          })();
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
      console.log("walletAddress", { walletAddress: walletAddress.toBase58() });
    } else if (!connected && !register) {
      const defaultKey = PublicKey.default;
      // console.log("🔄 Setting default wallet address (not connected, not registered)");

      // 只在需要重置时才更新
      // if (!walletAddress.equals(defaultKey)) {
      setWalletAddress(defaultKey);
      // }

      // if (!wallet.publicKey.equals(defaultKey)) {
      setWallet({
        publicKey: defaultKey,
        signTransaction: () => new Promise(() => {}),
        signAllTransactions: () => new Promise(() => {}),
      });
      // }
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

  React.useEffect(() => {
    if (connected) {
      resetMixinBalanceAddressMap(balanceAddressMap);
    }
    const id = window.setInterval(() => {
      const store = useComputerStore.getState();
      if (store.connected) {
        resetMixinBalanceAddressMap(store.balanceAddressMap);
      } else if (store.connected && !store.register) {
        resetMixinBalanceAddressMap(store.balanceAddressMap);
      } else {
        resetMixinBalanceAddressMap({});
      }
    }, 1 * 1000);
    return () => window.clearInterval(id);
  }, []);

  const { extendedBanks } = useExtendedBanks();
  const { stakePoolMetadataMap } = useNativeStakeData();

  const { wrappedAccount: selectedAccount } = useWrappedMarginfiAccount(wallet);

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

  // 处理余额更新
  React.useEffect(() => {
    if (connected && computerAssets.length > 0) {
      updateBalances(computerAssets);
    }
  }, [connected, computerAssets.length]); // 依赖连接状态和资产数量

  const refreshMixinBalances = async () => {
    console.log("🔄 FluxlendProvider refreshMixinBalances");
    await updateBalances(computerAssets);
    resetMixinBalanceAddressMap(balanceAddressMap);
  };

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
        connected={connected && register} // ✅ 修复: 用户必须已连接 Mixin 且已注册金融云
        setDisplaySettings={setDisplaySettings}
        stakePoolMetadataMap={stakePoolMetadataMap}
        stakeAccounts={stakeAccounts ?? []}
        getUserMix={getUserMix}
        computerInfo={computerInfo}
        connection={connection}
        computerAccount={computerAccount}
        getComputerRecipient={getComputerRecipient}
        balanceAddressMap={balanceAddressMap}
        fetchTransaction={getMixinClient()?.utxo.fetchTransaction}
        refreshMixinBalances={refreshMixinBalances}
        mixinUser={mixinUser}
        // ✅ 新增: 明确传递 Mixin 登录和注册状态
        mixinConnected={connected} // Mixin 登录状态
        mixinRegistered={register} // 金融云注册状态
      >
        {children}

        {/* Mixin 注册守卫 - 检测未注册用户并显示提示 */}
        <MixinRegisterGuard />

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
