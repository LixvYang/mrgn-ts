import React from "react";

import { LAMPORTS_PER_SOL, Transaction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { createJupiterApiClient } from "@jup-ag/api";

import { makeBundleTipIx, makeUnwrapSolIx, MarginfiAccountWrapper, MarginfiClient } from "@mrgnlabs/marginfi-client-v2";
import { ExtendedBankInfo, ActionType } from "@mrgnlabs/marginfi-v2-ui-state";
import {
  ActionMessageType,
  deserializeInstruction,
  extractErrorString,
  getSwapQuoteWithRetry,
  LstData,
  StakeActionTxns,
  STATIC_SIMULATION_ERRORS,
  usePrevious,
} from "@mrgnlabs/mrgn-utils";
import {
  LST_MINT,
  LUT_PROGRAM_AUTHORITY_INDEX,
  NATIVE_MINT as SOL_MINT,
  SolanaTransaction,
  TransactionBroadcastType,
  uiToNative,
} from "@mrgnlabs/mrgn-common";

import { createStakeLstTx, createUnstakeLstTx, getSimulationResult } from "../utils";
import { SimulationStatus } from "../../../utils/simulation.utils";
import { useActionBoxStore } from "../../../store";

type StakeSimulationProps = {
  debouncedAmount: number;
  lstData: LstData | null;

  selectedBank: ExtendedBankInfo | null;
  actionMode: ActionType;
  actionTxns: StakeActionTxns;
  simulationResult: any | null;
  marginfiClient: MarginfiClient | null;
  setSimulationResult: (result: any | null) => void;
  setActionTxns: (actionTxns: StakeActionTxns) => void;
  setErrorMessage: (error: ActionMessageType | null) => void;
  setIsLoading: ({ state, type }: { state: boolean; type: string | null }) => void;
};

export function useStakeSimulation({
  debouncedAmount,
  lstData,
  selectedBank,
  actionMode,
  actionTxns,
  simulationResult,
  marginfiClient,
  setSimulationResult,
  setActionTxns,
  setErrorMessage,
  setIsLoading,
}: StakeSimulationProps) {
  const [slippageBps, platformFeeBps] = useActionBoxStore((state) => [state.slippageBps, state.platformFeeBps]);
  const [simulationStatus, setSimulationStatus] = React.useState<SimulationStatus>(SimulationStatus.IDLE);
  const prevDebouncedAmount = usePrevious(debouncedAmount);
  const [hasUserInteracted, setHasUserInteracted] = React.useState(false);

  const handleSimulation = React.useCallback(
    async (txns: (VersionedTransaction | Transaction)[]) => {
      if (!hasUserInteracted) return;
      try {
        setSimulationStatus(SimulationStatus.SIMULATING);
        if (selectedBank && txns.length > 0) {
          const { actionMethod } = await getSimulationResult({
            marginfiClient: marginfiClient as MarginfiClient,
            txns,
            selectedBank,
          });

          if (actionMethod) {
            setErrorMessage(actionMethod);
            setSimulationResult(null);
          } else {
            setErrorMessage(null);
            setSimulationResult(simulationResult);
          }
        } else {
          setSimulationResult(null);
        }
      } catch (error) {
        console.error("Error simulating transaction", error);
        setSimulationResult(null);
      } finally {
        setIsLoading({ type: "SIMULATION", state: false });
      }
    },
    [
      selectedBank,
      marginfiClient,
      setSimulationResult,
      simulationResult,
      setIsLoading,
      setErrorMessage,
      hasUserInteracted,
    ]
  );

  console.log("simulationStatus", simulationStatus);

  const fetchTxs = React.useCallback(
    async (amount: number, actionType: ActionType) => {
      setHasUserInteracted(true);
      setSimulationStatus(SimulationStatus.PREPARING);
      const connection = marginfiClient?.provider.connection;

      if (amount === 0 || !selectedBank || !connection || !lstData) {
        const missingParams = [];
        if (amount === 0) missingParams.push("amount");
        if (!selectedBank) missingParams.push("selectedBank");
        if (!connection) missingParams.push("connection");
        if (!lstData) missingParams.push("lstData");

        setActionTxns({
          actionTxn: null,
          additionalTxns: [],
          actionQuote: null,
        });
        return;
      }

      setIsLoading({ type: "SIMULATION", state: true });

      try {
        let swapQuote = null;
        let swapTx: SolanaTransaction | null = null;

        if (actionType === ActionType.UnstakeLST) {
          const _actionTxns = await createUnstakeLstTx({
            amount,
            feepayer: marginfiClient.wallet.publicKey,
            connection,
            jupOpts: {
              slippageBps,
              platformFeeBps,
            },
          });

          if ("actionTxn" in _actionTxns) {
            setActionTxns(_actionTxns);
          } else {
            setErrorMessage(_actionTxns);
          }
        } else {
          const _actionTxns = await createStakeLstTx({
            amount,
            selectedBank,
            feepayer: marginfiClient.wallet.publicKey,
            connection,
            lstData,
            jupOpts: {
              slippageBps,
              platformFeeBps,
            },
          });

          if ("actionTxn" in _actionTxns) {
            setActionTxns(_actionTxns);
          } else {
            setErrorMessage(_actionTxns);
          }
        }
      } catch (error) {
        const msg = extractErrorString(error);
        console.error(`Error while simulating stake action: ${msg}`);
        setErrorMessage(STATIC_SIMULATION_ERRORS.STAKE_SIMULATION_FAILED);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [marginfiClient, selectedBank, slippageBps, setActionTxns, setIsLoading, platformFeeBps]
  );

  const refreshSimulation = React.useCallback(async () => {
    await fetchTxs(debouncedAmount ?? 0, actionMode);
  }, [fetchTxs, debouncedAmount, actionMode]);

  React.useEffect(() => {
    // only simulate when amount changes
    if (prevDebouncedAmount !== debouncedAmount) {
      // Only set to PREPARING if we're actually going to simulate
      if (debouncedAmount > 0) {
        setSimulationStatus(SimulationStatus.PREPARING);
        fetchTxs(debouncedAmount, actionMode);
      } else {
        // If amount is 0, move back to idle
        setSimulationStatus(SimulationStatus.IDLE);
      }
    }
  }, [prevDebouncedAmount, debouncedAmount, fetchTxs, actionMode, hasUserInteracted]);

  // Add transaction check effect
  React.useEffect(() => {
    // Only run simulation if user has interacted and we have transactions
    if (actionTxns?.actionTxn || (actionTxns?.additionalTxns?.length ?? 0) > 0) {
      handleSimulation([
        ...(actionTxns?.additionalTxns ?? []),
        ...(actionTxns?.actionTxn ? [actionTxns?.actionTxn] : []),
      ]);
    } else {
      // If no transactions or no user interaction, stay in idle state
      setSimulationStatus(SimulationStatus.IDLE);
      setIsLoading({ type: "SIMULATION", state: false });
    }
  }, [actionTxns]);

  return { handleSimulation, refreshSimulation, simulationStatus };
}
