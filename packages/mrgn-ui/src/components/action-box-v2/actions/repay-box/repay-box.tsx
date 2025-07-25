import React from "react";
import { v4 as uuidv4 } from "uuid";

import {
  ExtendedBankInfo,
  ActionType,
  AccountSummary,
  computeAccountSummary,
  DEFAULT_ACCOUNT_SUMMARY,
} from "@mrgnlabs/mrgn-state";
import { MarginfiAccountWrapper, MarginfiClient } from "@mrgnlabs/marginfi-client-v2";
import {
  ActionMessageType,
  checkRepayActionAvailable,
  ExecuteRepayActionProps,
  ExecuteRepayAction,
  logActivity,
} from "@mrgnlabs/mrgn-utils";
import { dynamicNumeralFormatter } from "@mrgnlabs/mrgn-common";

import { CircularProgress } from "~/components/ui/circular-progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { TooltipProvider } from "~/components/ui/tooltip";
import { ActionMessage } from "~/components/action-message";

import { usePollBlockHeight, useActionAmounts } from "~/components/action-box-v2/hooks";
import { useActionContext } from "~/components/action-box-v2/contexts";
import { useActionBoxStore } from "~/components/action-box-v2/store";
import { ActionSummary, PreviewStat, SimulationStatus } from "~/components/action-box-v2/utils";
import {
  ActionBoxContentWrapper,
  ActionCollateralProgressBar,
  ActionButton,
  ActionSimulationStatus,
  ActionSettingsButton,
} from "~/components/action-box-v2/components";

import { ActionInput, Preview, PreviewProps } from "./components";
import { useRepaySimulation } from "./hooks";
import { useRepayBoxStore } from "./store";

type AdditionalSettings = {
  showAvailableCollateral?: boolean;
  isInputSelectable?: boolean;
  overrideButtonLabel?: string;
  overrideStats?: (props: PreviewProps) => PreviewStat[];
};

export type RepayBoxProps = {
  nativeSolBalance: number;
  connected: boolean;
  marginfiClient: MarginfiClient | null;
  selectedAccount: MarginfiAccountWrapper | null;
  banks: ExtendedBankInfo[];
  requestedBank: ExtendedBankInfo;
  requestedSecondaryBank?: ExtendedBankInfo;
  initialAmount?: number;
  accountSummaryArg?: AccountSummary;
  isDialog?: boolean;
  additionalSettings?: AdditionalSettings;

  onComplete?: () => void;
  captureEvent?: (event: string, properties?: Record<string, any>) => void;
  setDisplaySettings?: (displaySettings: boolean) => void;
};

export const RepayBox = ({
  nativeSolBalance,
  connected,
  marginfiClient,
  selectedAccount,
  banks,
  requestedBank,
  requestedSecondaryBank,
  initialAmount,
  accountSummaryArg,
  isDialog,
  additionalSettings,
  onComplete,
  captureEvent,
  setDisplaySettings,
}: RepayBoxProps) => {
  const [
    amountRaw,
    repayAmount,
    selectedBank,
    selectedSecondaryBank,
    simulationResult,
    actionTxns,
    errorMessage,

    maxAmountCollateral,
    maxOverflowHit,

    refreshState,
    refreshSelectedBanks,
    fetchActionBoxState,
    setAmountRaw,
    setRepayAmount,
    setSimulationResult,
    setActionTxns,
    setErrorMessage,
    setSelectedBank,
    setSelectedSecondaryBank,

    setMaxAmountCollateral,
    setMaxOverflowHit,
  ] = useRepayBoxStore((state) => [
    state.amountRaw,
    state.repayAmount,
    state.selectedBank,
    state.selectedSecondaryBank,
    state.simulationResult,
    state.actionTxns,
    state.errorMessage,

    state.maxAmountCollateral,
    state.maxOverflowHit,
    state.refreshState,
    state.refreshSelectedBanks,
    state.fetchActionBoxState,
    state.setAmountRaw,
    state.setRepayAmount,
    state.setSimulationResult,
    state.setActionTxns,
    state.setErrorMessage,
    state.setSelectedBank,
    state.setSelectedSecondaryBank,

    state.setMaxAmountCollateral,
    state.setMaxOverflowHit,
  ]);

  const [simulationStatus, setSimulationStatus] = React.useState<{
    isLoading: boolean;
    status: SimulationStatus;
  }>({
    isLoading: false,
    status: SimulationStatus.IDLE,
  });

  const { transactionSettings, priorityFees, jupiterOptions } = useActionContext() || {
    transactionSettings: null,
    priorityFees: null,
    jupiterOptions: null,
  };
  const { isRefreshTxn, blockProgress } = usePollBlockHeight(
    marginfiClient?.provider.connection,
    actionTxns?.lastValidBlockHeight
  );

  const [platformFeeBps] = useActionBoxStore((state) => [state.platformFeeBps]);

  const accountSummary = React.useMemo(() => {
    return accountSummaryArg ?? (selectedAccount ? computeAccountSummary(selectedAccount) : DEFAULT_ACCOUNT_SUMMARY);
  }, [accountSummaryArg, selectedAccount]);

  const actionMode = React.useMemo(() => {
    return selectedBank?.address.toBase58() !== selectedSecondaryBank?.address.toBase58()
      ? ActionType.RepayCollat
      : ActionType.Repay;
  }, [selectedBank, selectedSecondaryBank]);

  const buttonLabel = React.useMemo(() => {
    return selectedBank?.address.toBase58() !== selectedSecondaryBank?.address.toBase58()
      ? `Repay with ${selectedSecondaryBank?.meta.tokenSymbol}`
      : "Repay";
  }, [selectedBank, selectedSecondaryBank]);

  const { amount, debouncedAmount, walletAmount, maxAmount } = useActionAmounts({
    amountRaw,
    selectedBank: selectedBank,
    nativeSolBalance,
    actionMode,
    maxAmountCollateral,
  });

  const { actionSummary, refreshSimulation } = useRepaySimulation({
    debouncedAmount: debouncedAmount ?? 0,
    selectedAccount,
    marginfiClient,
    accountSummary,
    selectedBank,
    selectedSecondaryBank,
    actionTxns,
    simulationResult,
    isRefreshTxn,
    platformFeeBps,
    jupiterOptions,

    setSimulationResult,
    setActionTxns,
    setErrorMessage,
    setRepayAmount,
    setIsLoading: setSimulationStatus,
    setMaxAmountCollateral,
    setMaxOverflowHit,
  });

  const [additionalActionMessages, setAdditionalActionMessages] = React.useState<ActionMessageType[]>([]);

  React.useEffect(() => {
    if (debouncedAmount === 0 && simulationResult) {
      setActionTxns({
        transactions: [],
        actionQuote: null,
      });
      setSimulationResult(null);
    }
  }, [simulationResult, debouncedAmount, setActionTxns, setSimulationResult]);

  // Cleanup the store when the wallet disconnects
  React.useEffect(() => {
    if (!connected) {
      refreshState();
    }
  }, [refreshState, connected]);

  // Only set the action box state on mount
  React.useEffect(() => {
    fetchActionBoxState({ requestedBank: requestedBank, requestedSecondaryBank: requestedSecondaryBank });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchActionBoxState]);

  React.useEffect(() => {
    if (initialAmount !== undefined) {
      const finalAmount = Math.min(initialAmount, maxAmount);
      setAmountRaw(finalAmount.toString());
    }
  }, [initialAmount, setAmountRaw, maxAmount]);

  React.useEffect(() => {
    if (errorMessage && errorMessage.description) {
      setAdditionalActionMessages([errorMessage]);
    } else {
      setAdditionalActionMessages([]);
    }
  }, [errorMessage]);

  React.useEffect(() => {
    return () => {
      refreshState();
    };
  }, [refreshState]);

  const actionMessages = React.useMemo(() => {
    return checkRepayActionAvailable({
      amount,
      connected,
      selectedBank,
      selectedSecondaryBank,
      marginfiAccount: selectedAccount,
      actionQuote: actionTxns?.actionQuote ?? null,
      maxOverflowHit,
    });
  }, [amount, connected, selectedBank, selectedSecondaryBank, actionTxns.actionQuote, maxOverflowHit, selectedAccount]);

  //////////////////
  // Repay Action //
  //////////////////

  const handleRepayAction = React.useCallback(async () => {
    if (
      !marginfiClient ||
      !selectedAccount ||
      !marginfiClient.provider.connection ||
      !transactionSettings ||
      !selectedBank ||
      !selectedSecondaryBank
    ) {
      return;
    }

    const params: ExecuteRepayActionProps = {
      actionTxns,
      attemptUuid: uuidv4(),
      marginfiClient,
      processOpts: { ...priorityFees, broadcastType: transactionSettings.broadcastType },
      txOpts: {},
      callbacks: {
        captureEvent: captureEvent,
        onComplete: (txnSig: string) => {
          onComplete?.();
          // Log the activity
          const activityDetails: Record<string, any> = {
            amount: actionMode === ActionType.RepayCollat ? repayAmount : amount,
            symbol: selectedBank.meta.tokenSymbol,
            mint: selectedBank.info.rawBank.mint.toBase58(),
          };

          if (actionMode === ActionType.RepayCollat) {
            activityDetails.secondaryAmount = amount;
            activityDetails.secondarySymbol = selectedSecondaryBank.meta.tokenSymbol;
            activityDetails.secondaryMint = selectedSecondaryBank.info.rawBank.mint.toBase58();
          }

          logActivity(actionMode, txnSig, activityDetails, selectedAccount?.address).catch((error) => {
            console.error("Failed to log activity:", error);
          });
        },
      },
      actionType: actionMode,
      infoProps: {
        repayAmount: dynamicNumeralFormatter(repayAmount),
        repayToken: selectedSecondaryBank.meta.tokenSymbol,
        amount: dynamicNumeralFormatter(amount),
        token: selectedBank.meta.tokenSymbol,
      },
    };

    ExecuteRepayAction(params);

    setAmountRaw("");
  }, [
    actionMode,
    actionTxns,
    amount,
    captureEvent,
    marginfiClient,
    priorityFees,
    repayAmount,
    selectedAccount,
    selectedBank,
    selectedSecondaryBank,
    setAmountRaw,
    transactionSettings,
    onComplete,
  ]);

  return (
    <ActionBoxContentWrapper>
      {actionTxns.lastValidBlockHeight && blockProgress !== 0 && (
        <div className="mb-6">
          <div className="absolute top-0 right-0 z-50">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <CircularProgress
                    size={18}
                    strokeWidth={3}
                    value={blockProgress * 100}
                    strokeColor="stroke-mfi-action-box-accent-foreground/50"
                    backgroundColor="stroke-mfi-action-box-background-dark"
                  />
                </TooltipTrigger>
                <TooltipContent side="left">
                  <div className="space-y-2">
                    <p>Your transaction is ready for execution.</p>
                    <p>Once the spinner reaches 100%, if not processed, it will refresh to fetch updated quotes.</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
      <div>
        <ActionInput
          banks={banks}
          nativeSolBalance={nativeSolBalance}
          amount={amount}
          amountRaw={amountRaw}
          maxAmount={maxAmount}
          repayAmount={repayAmount}
          selectedBank={selectedBank}
          selectedSecondaryBank={selectedSecondaryBank}
          setAmountRaw={setAmountRaw}
          setSelectedBank={setSelectedBank}
          setSelectedSecondaryBank={setSelectedSecondaryBank}
          maxAmountCollateral={maxAmountCollateral}
          actionMethod={actionMode}
          isInputSelectable={additionalSettings?.isInputSelectable}
        />
      </div>

      {additionalActionMessages.concat(actionMessages).map(
        (actionMessage, idx) =>
          actionMessage.description && (
            <div className="pb-6" key={idx}>
              <ActionMessage
                actionMessage={actionMessage}
                retry={refreshSimulation}
                isRetrying={simulationStatus.isLoading}
              />
            </div>
          )
      )}

      {additionalSettings?.showAvailableCollateral && (
        <div className="mb-6">
          <ActionCollateralProgressBar selectedAccount={selectedAccount} actionSummary={actionSummary} />
        </div>
      )}

      <div className="mb-3">
        <ActionButton
          isLoading={simulationStatus.isLoading}
          isEnabled={
            !additionalActionMessages.concat(actionMessages).filter((value) => value.isEnabled === false).length &&
            actionTxns?.transactions.length > 0
          }
          connected={connected}
          handleAction={() => {
            handleRepayAction();
          }}
          buttonLabel={additionalSettings?.overrideButtonLabel ?? buttonLabel}
        />
      </div>

      <div className="flex items-center justify-between">
        <ActionSimulationStatus
          simulationStatus={simulationStatus.status}
          hasErrorMessages={additionalActionMessages.length > 0}
          isActive={selectedBank && amount > 0 ? true : false}
        />
        {setDisplaySettings && <ActionSettingsButton onClick={() => setDisplaySettings(true)} />}
      </div>

      {actionSummary && selectedBank && (
        <Preview
          actionSummary={actionSummary}
          borrowBank={selectedBank}
          depositBank={selectedSecondaryBank}
          depositAmount={amount}
          borrowAmount={repayAmount}
          isLoading={simulationStatus.isLoading}
          overrideStats={additionalSettings?.overrideStats}
        />
      )}
    </ActionBoxContentWrapper>
  );
};
