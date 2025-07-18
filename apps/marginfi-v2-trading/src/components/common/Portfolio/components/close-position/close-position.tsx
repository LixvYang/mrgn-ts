import React from "react";
import { v4 as uuidv4 } from "uuid";

import {
  ClosePositionActionTxns,
  ExecuteClosePositionActionProps,
  ExecuteClosePositionAction,
  extractErrorString,
  capture,
} from "@mrgnlabs/mrgn-utils";
import { ActiveBankInfo } from "@mrgnlabs/mrgn-state";
import { useWallet } from "@mrgnlabs/mrgn-ui";
import { MultiStepToastController, toastManager } from "@mrgnlabs/mrgn-toasts";

import { Button } from "~/components/ui/button";
import { ArenaBank, ArenaPoolPositions, ArenaPoolV2Extended } from "~/types/trade-store.types";
import { useWrappedAccount } from "~/hooks/useWrappedAccount";
import { useArenaClient } from "~/hooks/useArenaClient";
import { useConnection } from "~/hooks/use-connection";
import { useTradeStoreV2, useUiStore } from "~/store";
import { useLeveragedPositionDetails } from "~/hooks/arenaHooks";
import { usePositionsData } from "~/hooks/usePositionsData";

import { ClosePositionDialog } from "./components/close-position-dialog";
import { simulateClosePosition } from "./utils/close-position-utils";

interface ClosePositionProps {
  arenaPool: ArenaPoolV2Extended;
  positionsByGroupPk: Record<string, ArenaPoolPositions>;
  depositBanks: ArenaBank[];
  borrowBank: ArenaBank | null;
}

export const ClosePosition = ({ arenaPool, positionsByGroupPk, depositBanks, borrowBank }: ClosePositionProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [multiStepToast, setMultiStepToast] = React.useState<MultiStepToastController | null>(null);
  const [actionTxns, setActionTxns] = React.useState<ClosePositionActionTxns | null>(null);

  const client = useArenaClient({ groupPk: arenaPool.groupPk });
  const { wrappedAccount } = useWrappedAccount({
    client,
    groupPk: arenaPool.groupPk,
    banks: [arenaPool.tokenBank, arenaPool.quoteBank],
  });
  const { connection } = useConnection();
  const { wallet } = useWallet();
  const [platformFeeBps, broadcastType, priorityFees, jupiterOptions] = useUiStore((state) => [
    state.platformFeeBps,
    state.broadcastType,
    state.priorityFees,
    state.jupiterOptions,
  ]);
  const [refreshGroup] = useTradeStoreV2((state) => [state.refreshGroup]);
  const { positionSizeUsd, leverage } = useLeveragedPositionDetails({
    pool: arenaPool,
  });
  const positionData = usePositionsData({ groupPk: arenaPool.groupPk });

  const handleSimulation = React.useCallback(async () => {
    if (!wrappedAccount || !connection) {
      return;
    }
    const multiStepToast = toastManager.createMultiStepToast("Closing position", [
      { label: "Loading details..." },
      { label: "Signing transaction" },
      {
        label: `Closing ${depositBanks[0].meta.tokenSymbol}${
          borrowBank ? "/" + borrowBank?.meta.tokenSymbol : ""
        } position.`,
      },
    ]);
    multiStepToast.start();
    setIsLoading(true);
    try {
      const { actionTxns } = await simulateClosePosition({
        marginfiAccount: wrappedAccount,
        depositBanks: depositBanks as ActiveBankInfo[],
        borrowBank: borrowBank as ActiveBankInfo | null,
        jupiterOptions: jupiterOptions,
        connection: connection,
        platformFeeBps: platformFeeBps,
        tradeState: arenaPool.status,
      });

      multiStepToast.successAndNext();
      multiStepToast.pause();

      setActionTxns(actionTxns);
      setIsOpen(true);
    } catch (error) {
      console.error("Error simulating transaction", error);
      const msg = extractErrorString(error);
      multiStepToast.setFailed(msg ?? "Error simulating transaction");
      setActionTxns(null);
    } finally {
      setMultiStepToast(multiStepToast);
      setIsLoading(false);
    }
  }, [wrappedAccount, connection, depositBanks, borrowBank, jupiterOptions, platformFeeBps, arenaPool]);

  const [wasActionTaken, setWasActionTaken] = React.useState(false);

  const handleChangeDialogState = (open: boolean) => {
    setIsOpen(open);
    setActionTxns(null);
    if (!open) {
      if (!wasActionTaken && multiStepToast) {
        // User manually closed the dialog -> Close the toast
        const timeout = setTimeout(() => {
          multiStepToast.close();
        }, 2000);
        return () => clearTimeout(timeout);
      }

      // Reset wasActionTaken when the dialog closes
      setWasActionTaken(false);
    }
  };

  ////////////////////////////
  // Close Position Actions //
  ////////////////////////////
  const handleClosePositionAction = React.useCallback(async () => {
    if (!actionTxns || !client || !multiStepToast || !arenaPool) {
      return;
    }

    setWasActionTaken(true); // Mark that an action was taken

    const props: ExecuteClosePositionActionProps = {
      actionTxns,
      attemptUuid: uuidv4(),
      marginfiClient: client,
      multiStepToast,
      infoProps: {
        token: arenaPool.tokenBank.meta.tokenSymbol,
        tokenSize: positionSizeUsd.toString(),
        quoteSize: positionSizeUsd.toString(),
      },
      callbacks: {
        captureEvent: capture,
      },
      processOpts: { ...priorityFees, broadcastType },
      txOpts: {},
    };

    ExecuteClosePositionAction(props);
    setIsOpen(false);
  }, [actionTxns, client, multiStepToast, arenaPool, positionSizeUsd, priorityFees, broadcastType]);
  return (
    <>
      <Button
        onClick={handleSimulation}
        disabled={false}
        variant="short"
        size="sm"
        className="gap-1 min-w-16 bg-mrgn-red"
      >
        Close
      </Button>
      <ClosePositionDialog
        arenaPool={arenaPool}
        actionTransaction={actionTxns}
        positionsByGroupPk={positionsByGroupPk}
        depositBanks={depositBanks}
        borrowBank={borrowBank}
        isOpen={isOpen}
        onOpenChange={handleChangeDialogState}
        handleClosePosition={handleClosePositionAction}
        isLoading={isLoading}
        pnl={positionData?.pnl ?? 0}
      />
    </>
  );
};
