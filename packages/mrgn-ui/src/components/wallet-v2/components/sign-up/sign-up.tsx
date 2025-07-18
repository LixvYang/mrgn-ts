import React from "react";
import { useRouter } from "next/router";

import { MarginfiAccountWrapper, MarginfiClient } from "@mrgnlabs/marginfi-client-v2";
import { ExtendedBankInfo } from "@mrgnlabs/mrgn-state";

import { Dialog, DialogContent } from "~/components/ui/dialog";
import { useOs, useBrowser, cn } from "@mrgnlabs/mrgn-utils";
import { useWallet } from "~/components/wallet-v2";
import { AUTO_FLOW_MAP, AuthFlowType, AuthScreenProps } from "~/components/wallet-v2/components/sign-up/sign-up.utils";
import { useWalletStore } from "~/components/wallet-v2/store/wallet.store";
import { Progress } from "~/components/ui/progress";

type AuthDialogProps = {
  onboardingEnabled?: boolean;
  mrgnState?: {
    marginfiClient: MarginfiClient | null;
    selectedAccount: MarginfiAccountWrapper | null;
    extendedBankInfos: ExtendedBankInfo[];
    nativeSolBalance: number;
  };
};

export const AuthDialog = ({ mrgnState, onboardingEnabled = true }: AuthDialogProps) => {
  const [isWalletAuthDialogOpen, setIsWalletAuthDialogOpen] = useWalletStore((state) => [
    state.isWalletSignUpOpen,
    state.setIsWalletSignUpOpen,
  ]);

  const { isAndroid, isIOS, isPWA } = useOs();
  const browser = useBrowser();

  const showPWAInstallScreen = React.useMemo(
    () =>
      (isAndroid || isIOS) &&
      !(isPWA || browser === "Backpack" || browser === "Phantom" || browser === "Solflare") &&
      !localStorage.getItem("isOnboarded"),
    [isAndroid, isIOS, browser, isPWA]
  );

  const showInAppBrowser = React.useMemo(
    () => browser === "Backpack" || browser === "Phantom" || browser === "Solflare",
    [browser]
  );

  const mainFlow = React.useMemo(() => {
    const isOnboarded = localStorage.getItem("isOnboarded");
    const onboardingFlow = localStorage.getItem("onboardingFlow");

    if (onboardingFlow) {
      return onboardingFlow as AuthFlowType;
    }

    return isOnboarded !== null || !onboardingEnabled ? "RETURNING_USER" : "ONBOARD_MAIN";
  }, []);

  const [flow, setFlow] = React.useState<AuthFlowType>(mainFlow);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isActiveLoading, setIsActiveLoading] = React.useState<string>("");
  const [progress, setProgress] = React.useState<number>(0);
  const { loginWeb3Auth, connecting, connected, select, walletContextState } = useWallet();
  const { query, replace, pathname } = useRouter();

  // if user has PWA force social login
  React.useEffect(() => {
    const isOnboarding = localStorage.getItem("onboardingFlow");
    if (isPWA && !isOnboarding) {
      if (localStorage.getItem("isOnboarded")) {
        setFlow("RETURNING_PWA");
      } else {
        setFlow("ONBOARD_SOCIAL");
      }
    }
  }, [isPWA]);

  // if user is using mobile browser force PWA install screen
  React.useEffect(() => {
    if (showInAppBrowser) {
      setFlow("INAPP_MOBILE");
    } else if (showPWAInstallScreen) {
      setFlow("PWA_INSTALL");
    }
  }, [showPWAInstallScreen, showInAppBrowser]);

  React.useEffect(() => {
    if (!connecting) {
      setIsLoading(false);
      setIsActiveLoading("");
    }
  }, [connecting]);

  React.useEffect(() => {
    if (connected) {
      localStorage.removeItem("onboardingFlow");
    }
  }, [connected]);

  // if user is onramping redirect to correct flow
  React.useEffect(() => {
    // check if user is new
    if (query.onramp) {
      const selectedWallet = query.onramp as string;
      const flow = query.flow as string;

      if (flow === "eth") {
        setFlow("ONBOARD_ETH");
      } else if (flow === "sol") {
        setFlow("ONBOARD_SOL");
      } else {
        setFlow("ONBOARD_SOCIAL");
      }

      setIsLoading(true);
      setIsActiveLoading(selectedWallet);
      select(selectedWallet as any);

      const newQuery = { ...query };
      delete newQuery.onramp;
      delete newQuery.flow;
      replace(
        {
          pathname: pathname,
          query: newQuery,
        },
        undefined,
        { shallow: true }
      );
    }
  }, [pathname, query, query.onramp, replace, select, walletContextState]);

  // reset on force close
  React.useEffect(() => {
    if (!isWalletAuthDialogOpen) {
      setIsLoading(false);
      setIsActiveLoading("");
      setProgress(0);
    }
  }, [isWalletAuthDialogOpen]);

  const handleClose = () => {
    setIsWalletAuthDialogOpen(false);
  };

  const onSelectWallet = (selectedWallet: string | null) => {
    if (!selectedWallet) return;
    setIsLoading(true);
    setIsActiveLoading(selectedWallet);
    select(selectedWallet as any);
    localStorage.setItem("isOnboarded", "true");
  };

  return (
    <div>
      {isWalletAuthDialogOpen && <Progress value={progress} className="fixed top-0 h-1 rounded-none z-[999]" />}

      <Dialog
        open={isWalletAuthDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          } else setIsWalletAuthDialogOpen(open);
        }}
      >
        <DialogContent
          isBgGlass={true}
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            "md:block overflow-scroll p-4 pt-8 md:pt-4 justify-start md:max-w-xl duration-0",
            flow === "ONBOARD_MAIN" && "lg:max-w-6xl"
          )}
        >
          {React.createElement(AUTO_FLOW_MAP[flow].comp, {
            update: (newScreen) => setFlow(newScreen),
            onClose: () => {
              handleClose();
            },
            onPrev: () => setFlow("ONBOARD_MAIN"),
            isLoading: isLoading,
            flow: flow,
            isActiveLoading: isActiveLoading,
            mrgnState: mrgnState,
            setIsLoading: setIsLoading,
            setProgress: setProgress,
            select: onSelectWallet,
            setIsActiveLoading: setIsActiveLoading,
            loginWeb3Auth: (props: any) => {
              loginWeb3Auth(props);
              if (flow !== "RETURNING_PWA" && flow !== "RETURNING_USER") {
                localStorage.setItem("onboardingFlow", flow);
              } else {
                setIsWalletAuthDialogOpen(false);
              }
            },
          } as AuthScreenProps)}
        </DialogContent>
      </Dialog>
    </div>
  );
};
