/* eslint-disable react-hooks/exhaustive-deps */
import dynamic from "next/dynamic";
import { AppProps } from "next/app";
import React from "react";

import { cn } from "~/theme";
import { useAppStore } from "~/store";
import { Navbar } from "~/components/common";
import { Footer } from "~/components/desktop/Footer";

// Use require instead of import since order matters
require("~/styles/globals.css");
require("~/styles/fonts.css");

// const Footer = dynamic(async () => (await import("~/components/desktop/Footer")).Footer, { ssr: false });

// const Navbar = dynamic(async () => (await import("~/components/common/Navbar")).Navbar, {
//   ssr: false,
// });
type MrgnAppProps = { path: string };

export default function App({ Component, pageProps, path }: AppProps & MrgnAppProps) {
  const [
    connected,
    getUserMix,
    computerInfo,
    computerAccount,
    getComputerRecipient,
    balanceAddressMap,
    getMixinClient,
  ] = useAppStore((state) => [
    state.connected,
    state.getUserMix,
    state.info,
    state.account,
    state.getComputerRecipient,
    state.balanceAddressMap,
    state.getMixinClient,
  ]);

  return (
    <>
      <Navbar />
      <div className={cn("w-full flex flex-col justify-center items-center")}>
        <Component {...pageProps} />
      </div>
      <Footer />
    </>
  );
}
