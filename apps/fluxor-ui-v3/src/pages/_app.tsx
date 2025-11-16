import React, { Profiler } from "react";
import App, { AppContext, AppInitialProps, AppProps } from "next/app";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { TipLinkWalletAutoConnect } from "@tiplink/wallet-adapter-react-ui";
import { Analytics } from "@vercel/analytics/react";
import { registerMoonGateWallet } from "@moongate/moongate-adapter";
import { QueryClient } from "@tanstack/react-query";

import { initializeConfig, StateProvider } from "@mrgnlabs/mrgn-state";
import { cn, Desktop, Mobile, init as initAnalytics, AuthProvider } from "@mrgnlabs/mrgn-utils";
import { ActionProvider, WalletProvider as MrgnWalletProvider } from "@mrgnlabs/mrgn-ui";
import { generateEndpoint } from "~/rpc.utils";

import rpcConfig from "~/config";
import config from "~/config/marginfi";
import { FluxlendProvider, MrgnlendProvider } from "~/context";
import { WALLET_ADAPTERS } from "~/config/wallets";
import { useUiStore } from "~/store";
import { ConnectionProvider } from "~/hooks/use-connection";

import GlobalActionBoxPortal from "~/components/common/global-actionbox-portal/global-actionbox-portal";
import { Meta } from "~/components/common/Meta";
import { MobileNavbar } from "~/components/mobile/MobileNavbar";
import { Tutorial } from "~/components/common/Tutorial";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import { ToastProvider } from "@mrgnlabs/mrgn-toasts";
import { AdditionalProvider } from "~/context/AdditionalProvider";
import { MixinProvider } from "~/context/MixinProvider";
import { GlobalStatistics } from "~/components/common/GlobalStatistics";

registerMoonGateWallet({ authMode: "Google", position: "bottom-right" });
registerMoonGateWallet({ authMode: "Ethereum", position: "bottom-right" });

// Use require instead of import since order matters
require("~/styles/globals.css");
require("~/styles/fonts.css");

const Navbar = dynamic(async () => (await import("~/components/common/Navbar")).Navbar, {
  ssr: false,
});

const Footer = dynamic(async () => (await import("~/components/desktop/Footer")).Footer, { ssr: false });

type MrgnAppProps = { path: string };

const qc = new QueryClient();

initializeConfig({
  rpcUrl: rpcConfig.rpcEndpoint,
  mrgnConfig: config.mfiConfig,
  isMixin: true,
});

export default function MrgnApp({ Component, pageProps }: AppProps) {
  const [
    broadcastType,
    priorityFees,
    setIsFetchingData,
    displaySettings,
    setDisplaySettings,
    jupiterOptions,
    priorityType,
    maxCapType,
    globalActionBoxProps,
  ] = useUiStore((state) => [
    state.broadcastType,
    state.priorityFees,
    state.setIsFetchingData,
    state.displaySettings,
    state.setDisplaySettings,
    state.jupiterOptions,
    state.priorityType,
    state.maxCapType,
    state.globalActionBoxProps,
  ]);

  const { query, isReady, pathname } = useRouter();
  const [ready, setReady] = React.useState(false);
  const [rpcEndpoint, setRpcEndpoint] = React.useState("");

  // React.useEffect(() => {
  //   const isFetchingData = isRefreshingMrgnlendStore;
  //   setIsFetchingData(isFetchingData);
  // }, [isMrgnlendStoreInitialized, isRefreshingMrgnlendStore, setIsFetchingData]);

  React.useEffect(() => {
    const init = async () => {
      const rpcEndpoint = await generateEndpoint(rpcConfig.rpcEndpoint, process.env.NEXT_PUBLIC_RPC_PROXY_KEY ?? "");
      setRpcEndpoint(rpcEndpoint);
      setReady(true);
      initAnalytics();
    };

    init();
  }, []);

  return (
    <>
      <Meta path={pathname} title={pageProps.metadata?.title} />

      <StateProvider config={{ rpcUrl: rpcConfig.rpcEndpoint, mrgnConfig: config.mfiConfig }}>
        {ready && rpcEndpoint && (
          <ConnectionProvider endpoint={rpcEndpoint}>
            <TipLinkWalletAutoConnect isReady={isReady} query={query}>
              <WalletProvider wallets={WALLET_ADAPTERS} autoConnect={true}>
                <AuthProvider>
                  <MrgnWalletProvider>
                    <AdditionalProvider>
                      <FluxlendProvider>
                        <MixinProvider>
                          <ActionProvider
                            transactionSettings={{
                              broadcastType,
                              priorityType,
                              maxCap: priorityFees.maxCapUi ?? 0,
                              maxCapType,
                            }}
                            jupiterOptions={{ ...jupiterOptions, slippageBps: jupiterOptions.slippageBps }}
                            priorityFees={priorityFees}
                          >
                            <Navbar />

                            <Desktop>
                              <WalletModalProvider>
                                <div className={cn("w-full flex flex-col justify-center items-center")}>
                                  <Component {...pageProps} />
                                </div>
                                <Footer />
                              </WalletModalProvider>
                            </Desktop>

                            <Mobile>
                              <div className={cn("w-full flex flex-col justify-center items-center")}>
                                <Component {...pageProps} />
                              </div>
                              <MobileNavbar />
                            </Mobile>

                            {/* <Analytics /> */}
                            {/* <Tutorial /> */}

                            <ToastProvider />
                            {globalActionBoxProps.isOpen && <GlobalActionBoxPortal />}
                          </ActionProvider>
                        </MixinProvider>
                      </FluxlendProvider>
                    </AdditionalProvider>
                  </MrgnWalletProvider>
                </AuthProvider>
              </WalletProvider>
            </TipLinkWalletAutoConnect>
          </ConnectionProvider>
        )}
      </StateProvider>

      {/* {process.env.NEXT_PUBLIC_ANALYTICS === "true" && ready && (
        <>
          <GoogleAnalytics gaId="G-0ZTQRWVG02" />
          <GoogleTagManager gtmId="GTM-KJJ3CR6Q" />
          <SpeedInsights />
        </>
      )} */}
    </>
  );
}

MrgnApp.getInitialProps = async (appContext: AppContext): Promise<AppInitialProps & MrgnAppProps> => {
  const appProps = await App.getInitialProps(appContext);
  const path = appContext.ctx.pathname;

  if (path === "/banks/[address]") {
    try {
      const bankAddress = appContext.ctx.query.address;

      if (bankAddress && typeof bankAddress === "string") {
        // 银行地址到代币符号的映射表（与API路由保持一致）
        const BANK_ADDRESS_TO_SYMBOL: Record<string, string> = {
          CK1Qnz6C6uZEiJFrTSkkgV485UuDJidaSxqewzYeCU7x: "SOL",
          CnMFqmJhMdbXPAixtVfwwR3xwTid8zjTanrFbRWboFhx: "USDC",
          FJyfHYZeUzUyNzuPxABdFXMkX8D4fdrqjbLWZi9hjSFg: "USDT",
          FUjZmnqNMTYMdMTzrUR3UJ5hA8v3jMhpqP9RTxeVMU9E: "JitoSOL",
          "7uEFHAWngQ5yd8bNgcUSyG3F5sCmWoyKuGQXjrZt2xDh": "XIN",
          oHy5VfaQbLepwapcWwAhUhCt6ji8FPD81zRuSTA44uN: "BTC",
          "5nnszMQMzVwLEUyFYMoLsPCQ9B58t6emAN1bWLWEsMyq": "ETH",
          A1HA62KfSqM1kSM2FR5xwGbzMdihBsRj8HajSMmEaMPo: "USDT(ETH)",
        };

        const symbol = BANK_ADDRESS_TO_SYMBOL[bankAddress];

        if (symbol) {
          appProps.pageProps.metadata = {
            title: symbol,
          };
        }
      }
    } catch (error) {
      console.error("Error setting bank metadata:", error);
      // 即使获取失败，也继续渲染页面，使用默认标题
    }
  }

  return { ...appProps, path };
};
