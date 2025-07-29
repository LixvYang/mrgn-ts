import React, { memo } from "react";

import {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
  SolanaJSONRPCError,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  attachInvoiceEntry,
  attachStorageEntry,
  checkSystemCallSize,
  formatUnits,
  getInvoiceString,
  MixinApi,
  MixinInvoice,
  newMixinInvoice,
  OperationTypeSystemCall,
  OperationTypeUserDeposit,
  uniqueConversationID,
  userIdToBytes,
} from "@mixin.dev/mixin-node-sdk";

import { AccountSummary, ActionType, ExtendedBankInfo } from "@mrgnlabs/mrgn-state";
import {
  BroadcastMethodType,
  DEFAULT_PROCESS_TX_OPTS,
  DEFAULT_PROCESS_TX_STRATEGY,
  formatTransactions,
  MarginfiAccountWrapper,
  MarginfiClient,
  ProcessTransactionError,
  ProcessTransactionErrorType,
  ProcessTransactionsClientOpts,
  SimulationResult,
  SpecificBroadcastMethod,
} from "@mrgnlabs/marginfi-client-v2";
import { ActionMessageType, ActionTxns } from "@mrgnlabs/mrgn-utils";

import { calculateSummary, generateActionTxns, getLendSimulationResult } from "../utils";
import { SimulationStatus } from "~/components/action-box-v2/utils";
import {
  ComputerUserResponse,
  ComputerInfoResponse,
  XIN_ASSET_ID,
  UserAssetBalance,
  DEFAULT_CONFIRM_OPTS,
  SolanaTransaction,
  TransactionOptions,
  getComputeBudgetUnits,
  microLamportsToUi,
  ComputerSystemCallRequest,
  SOL_DECIMAL,
  MARGINFI_ACCOUNT_INITIALIZE_RENT_SIZES,
  TransactionType,
  MARGINFI_ACCOUNT_BORROW_RENT_SIZES,
  MARGINFI_ACCOUNT_WITHDRAW_RENT_SIZES,
  MARGINFI_ACCOUNT_DEPOSIT_RENT_SIZES,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
} from "@mrgnlabs/mrgn-common";
import {
  buildSystemCallInvoiceExtra,
  add,
  handleInvoiceSchema,
  computerClient,
  buildComputerExtra,
} from "@mrgnlabs/fluxor-state";
import BigNumber from "bignumber.js";
import { initComputerClient } from "@mrgnlabs/fluxor-state";

type LendMixinSimulationProps = {
  debouncedAmount: number;
  selectedAccount: MarginfiAccountWrapper | null;
  marginfiClient: MarginfiClient | null;
  accountSummary?: AccountSummary;
  selectedBank: ExtendedBankInfo | null;
  lendMode: ActionType;
  actionTxns: ActionTxns;
  simulationResult: SimulationResult | null;
  selectedStakeAccount?: PublicKey;
  setSimulationResult: (result: SimulationResult | null) => void;
  setActionTxns: (actionTxns: ActionTxns) => void;
  setErrorMessage: (error: ActionMessageType | null) => void;
  setIsLoading: ({ isLoading, status }: { isLoading: boolean; status: SimulationStatus }) => void;

  getUserMix?: () => string;
  computerInfo?: ComputerInfoResponse;
  connection?: Connection;
  computerAccount?: ComputerUserResponse;
  getComputerRecipient?: () => string;
  balanceAddressMap?: Record<string, UserAssetBalance>;
  processOpts?: ProcessTransactionsClientOpts;
  txOpts?: TransactionOptions;
  //   tokenMap: Record<string, Token>;
};

// 核心目标: 构建 mixin pay url

// 移除 React Hook，改成普通的异步函数
async function handleLendMixinSimulation({
  amount,
  selectedAccount,
  selectedBank,
  lendMode,
  marginfiClient,
  getUserMix,
  computerInfo,
  connection,
  computerAccount,
  getComputerRecipient,
  balanceAddressMap,
  selectedStakeAccount,
  processOpts: processOptsArgs,
  txOpts,
  setIsLoading,
}: {
  amount: number;
  selectedAccount: MarginfiAccountWrapper | null;
  selectedBank: ExtendedBankInfo;
  lendMode: ActionType;
  marginfiClient: MarginfiClient;
  getUserMix: (() => string) | undefined;
  computerInfo: ComputerInfoResponse | undefined;
  connection: Connection | undefined;
  computerAccount: ComputerUserResponse | undefined;
  getComputerRecipient: (() => string) | undefined;
  balanceAddressMap: Record<string, UserAssetBalance> | undefined;
  selectedStakeAccount?: PublicKey;
  processOpts?: ProcessTransactionsClientOpts;
  txOpts?: TransactionOptions;
  setIsLoading: ({ isLoading, status }: { isLoading: boolean; status: SimulationStatus }) => void;
}): Promise<ComputerSystemCallRequest[]> {
  console.log("props: ", {
    getUserMix,
    computerInfo,
    connection,
    computerAccount,
    getComputerRecipient,
    balanceAddressMap,
  });
  if (!getUserMix || !computerInfo || !connection || !computerAccount || !getComputerRecipient || !balanceAddressMap) {
    throw new Error("Missing required props");
  }

  console.log("lendMode: ", lendMode);
  console.log("bank address: ", selectedBank.meta.address.toBase58());
  console.log("selectedBank: ", selectedBank.meta);

  // 如果金额为0或缺少必要参数，直接返回空交易
  if (amount === 0 || !selectedBank || !marginfiClient) {
    return [];
  }
  setIsLoading({ isLoading: true, status: SimulationStatus.SIMULATING });

  try {
    // 1. 获取交易
    const actionTxns = await generateActionTxns({
      marginfiAccount: selectedAccount,
      marginfiClient,
      bank: selectedBank,
      lendMode,
      amount,
    });

    if (!actionTxns.finalAccount) {
      throw new Error("Account not initialized");
    }
    console.log("actionTxns: ", actionTxns);

    let broadcastType: BroadcastMethodType = "RPC";
    let finalFallbackMethod: SpecificBroadcastMethod[] = DEFAULT_PROCESS_TX_STRATEGY.fallbackSequence.filter(
      (method) => method.broadcastType === "RPC"
    );

    let versionedTransactions: VersionedTransaction[] = [];
    let minContextSlot: number;
    let blockhash: string;
    let lastValidBlockHeight: number;
    const commitment = connection.commitment ?? DEFAULT_CONFIRM_OPTS.commitment;

    try {
      const getLatestBlockhashAndContext = await connection.getLatestBlockhashAndContext(commitment);

      minContextSlot = getLatestBlockhashAndContext.context.slot - 4;
      blockhash = getLatestBlockhashAndContext.value.blockhash;
      lastValidBlockHeight = getLatestBlockhashAndContext.value.lastValidBlockHeight;
    } catch (error) {
      console.error("Failed to get latest blockhash and context", error);

      if (error instanceof SolanaJSONRPCError) {
        throw error;
      }

      throw new ProcessTransactionError({
        message: "Failed to get latest blockhash and context.",
        type: ProcessTransactionErrorType.TransactionBuildingError,
        failedTxs: actionTxns.transactions,
      });
    }

    let updatedTransactions: SolanaTransaction[] = actionTxns.transactions;
    const processOpts = {
      ...DEFAULT_PROCESS_TX_OPTS,
      ...processOptsArgs,
    };

    const maxCapUi = processOptsArgs?.maxCapUi;

    console.log("------ Transaction Details 👇 ------");
    console.log(
      `📝 Executing ${actionTxns.transactions.length} transaction${actionTxns.transactions.length > 1 ? "s" : ""}`
    );
    console.log(`📡 Broadcast type: ${broadcastType}`);
    let txAction: TransactionType | undefined;
    updatedTransactions.forEach(async (tx, idx) => {
      if (tx.type === TransactionType.DEPOSIT) {
        txAction = TransactionType.DEPOSIT;
      } else if (tx.type === TransactionType.BORROW) {
        txAction = TransactionType.BORROW;
      } else if (tx.type === TransactionType.WITHDRAW) {
        txAction = TransactionType.WITHDRAW;
      } else if (tx.type === TransactionType.CREATE_ACCOUNT || tx.type === TransactionType.CRANK) {
      } else {
        throw new Error("Invalid transaction type");
      }
      const cu = getComputeBudgetUnits(tx);
      const priorityFeeUi = maxCapUi
        ? Math.min(processOpts.priorityFeeMicro ? microLamportsToUi(processOpts.priorityFeeMicro, cu) : 0, maxCapUi)
        : processOpts.priorityFeeMicro
          ? microLamportsToUi(processOpts.priorityFeeMicro, cu)
          : 0;
      console.log(`💸 Priority fee for tx ${idx}: ${priorityFeeUi} SOL`);
    });
    if (
      !txAction ||
      (txAction !== TransactionType.DEPOSIT &&
        txAction !== TransactionType.BORROW &&
        txAction !== TransactionType.WITHDRAW)
    ) {
      throw new Error("Invalid transaction type");
    }

    console.log("--------------------------------");

    versionedTransactions = formatTransactions(
      updatedTransactions,
      broadcastType,
      blockhash,
      {
        priorityFeeMicro: processOpts.priorityFeeMicro ?? 0,
        bundleTipUi: processOpts.bundleTipUi ?? 0,
        feePayer: new PublicKey(computerInfo.payer),

        maxCapUi,
      },
      processOpts.addArenaTxTag
    );

    if (txOpts?.dryRun || processOpts?.isReadOnly) {
      // await dryRunTransaction(processOpts, connection, versionedTransactions);
      return [];
    }

    // 2. 获取 nonce
    // 3. 处理交易指令
    for (const txn of versionedTransactions) {
      const txBuf = Buffer.from(txn.serialize());
      if (!checkSystemCallSize(txBuf)) {
        throw new Error("Transaction size exceeds limit");
      } else {
        console.log("Transaction size is within limit");
      }
    }

    if (versionedTransactions.length > 2) {
      throw new Error("Transaction size exceeds limit");
    }

    const rentMap: Record<string, number> = {};
    const sizes = Array.from(
      new Set([
        ...MARGINFI_ACCOUNT_INITIALIZE_RENT_SIZES,
        ...MARGINFI_ACCOUNT_DEPOSIT_RENT_SIZES,
        ...MARGINFI_ACCOUNT_BORROW_RENT_SIZES,
        ...MARGINFI_ACCOUNT_WITHDRAW_RENT_SIZES,
      ])
    );
    const rents = await Promise.all(sizes.map((size) => connection.getMinimumBalanceForRentExemption(size)));
    sizes.forEach((size, index) => {
      rentMap[size] = rents[index];
    });

    // 4. 构建最终交易
    let invoice = newMixinInvoice(getComputerRecipient());
    if (!invoice) throw new Error("invalid invoice recipient!");
    let resultTrace = "";

    const { resultTrace: resultTrace2, invoice: invoice2 } = await handleVxLength({
      txAction,
      versionedTransactions,
      computerClient,
      getUserMix,
      computerInfo,
      connection,
      updatedTransactions,
      balanceAddressMap,
      selectedBank,
      marginfiClient,
      computerAccount,
      rentMap,
      invoice,
      amount,
      actionTxns: actionTxns,
    });
    resultTrace = resultTrace2;
    invoice = invoice2;
    console.log("resultTrace: ", resultTrace);
    if (!resultTrace || resultTrace.length === 0) {
      throw new Error("resultTrace not found");
    }

    const url = handleInvoiceSchema(getInvoiceString(invoice));
    console.log(invoice, url);
    const mixinApi = MixinApi();
    const scheme = await mixinApi.code.schemes(url);
    const req1 = {
      trace: resultTrace,
      value: `https://mixin.one/schemes/${scheme.scheme_id}`,
    };
    setIsLoading({ isLoading: false, status: SimulationStatus.COMPLETE });
    return [req1];
  } catch (error) {
    console.error("Error in handleLendMixinSimulation:", error);
    setIsLoading({ isLoading: false, status: SimulationStatus.COMPLETE });
    return [];
  }
}

interface HandleVxLength1Args {
  txAction: TransactionType;
  versionedTransactions: VersionedTransaction[];
  computerClient: any;
  getUserMix: () => string;
  computerInfo: ComputerInfoResponse;
  connection: Connection;
  updatedTransactions: SolanaTransaction[];
  balanceAddressMap: Record<string, UserAssetBalance>;
  selectedBank: ExtendedBankInfo;
  marginfiClient: MarginfiClient;
  computerAccount: ComputerUserResponse;
  rentMap: Record<string, number>;
  invoice: MixinInvoice;
  amount: number;
  actionTxns: {
    transactions: SolanaTransaction[];
    finalAccount: MarginfiAccountWrapper;
  };
}

async function handleVxLength(args: HandleVxLength1Args): Promise<{
  resultTrace: string;
  invoice: MixinInvoice;
}> {
  if (args.versionedTransactions.length === 1) {
    return handleVxLength1(args);
  } else if (args.versionedTransactions.length === 2) {
    return handleVxLength2(args);
  } else {
    throw new Error("Transaction size exceeds limit");
  }
}

async function handleVxLength1({
  txAction,
  versionedTransactions,
  computerClient,
  getUserMix,
  computerInfo,
  connection,
  updatedTransactions,
  balanceAddressMap,
  selectedBank,
  marginfiClient,
  computerAccount,
  rentMap,
  invoice,
  amount,
  actionTxns,
}: HandleVxLength1Args): Promise<{
  resultTrace: string;
  invoice: MixinInvoice;
}> {
  let resultTrace = "";

  const referenceExtra = Buffer.from(
    buildComputerExtra(computerInfo.members.app_id, OperationTypeUserDeposit, userIdToBytes(computerAccount.id))
  );

  if (txAction === TransactionType.DEPOSIT) {
    // 2. deposit
    const nonce1 = await computerClient.getNonce(getUserMix());
    const depositAddressLookupsRes = await Promise.all(
      (versionedTransactions[0] as VersionedTransaction).message.addressTableLookups.map((a) =>
        connection.getAddressLookupTable(a.accountKey)
      )
    );
    const depositAddressLookups = depositAddressLookupsRes
      .filter((r) => r.value)
      .map((r) => r.value) as AddressLookupTableAccount[];

    const depositInx = TransactionMessage.decompile(versionedTransactions[0].message, {
      addressLookupTableAccounts: depositAddressLookups,
    }).instructions;

    const nonce1Ins = SystemProgram.nonceAdvance({
      noncePubkey: new PublicKey(nonce1.nonce_address),
      authorizedPubkey: new PublicKey(computerInfo.payer),
    });
    const message1V0 = new TransactionMessage({
      payerKey: new PublicKey(computerInfo.payer),
      recentBlockhash: nonce1.nonce_hash,
      instructions: [nonce1Ins, ...depositInx],
    }).compileToV0Message(depositAddressLookups);

    const depositTx = new VersionedTransaction(message1V0);
    if (updatedTransactions[0].signers) {
      depositTx.sign(updatedTransactions[0].signers);
    }
    console.log("depositTx: ", depositTx);
    // 5. 检查交易大小
    const depositTxBuf = Buffer.from(depositTx.serialize());
    if (!checkSystemCallSize(depositTxBuf)) {
      throw new Error("Transaction size exceeds limit");
    }
    console.log("depositTxBuf(base64): ", depositTxBuf.toString("base64"));

    const depositTrace = uniqueConversationID(depositTxBuf.toString("hex"), "system call");

    const balance = balanceAddressMap[selectedBank.info.rawBank.mint.toBase58()];
    const { needCreateAta: needCreateAtaWallet, userAta: userAtaWallet } = await checkWalletWSOLNeedCreateAta(
      marginfiClient,
      selectedBank,
      connection
    );
    let depositExtra: string;
    if (needCreateAtaWallet) {
      const solAmount = formatUnits(
        [165]
          .reduce((prev, cur) => {
            const total = prev + rentMap[cur];
            return total;
          }, 0)
          .toString(),
        SOL_DECIMAL
      ).toString();
      const fee = await computerClient.getFeeOnXin(solAmount);

      depositExtra = buildComputerExtra(
        computerInfo.members.app_id,
        OperationTypeSystemCall,
        buildSystemCallInvoiceExtra(computerAccount.id, depositTrace, false, fee.fee_id)
      );
      attachStorageEntry(invoice, uniqueConversationID(depositTrace, "storage"), depositTxBuf);
      attachInvoiceEntry(invoice, {
        trace_id: uniqueConversationID(depositTrace, balance.asset_id),
        asset_id: balance.asset_id,
        amount: amount.toString(),
        extra: referenceExtra,
        index_references: [],
        hash_references: [],
      });
      attachInvoiceEntry(invoice, {
        trace_id: depositTrace,
        asset_id: XIN_ASSET_ID,
        amount: add(computerInfo.params.operation.price, fee.xin_amount).toFixed(8, BigNumber.ROUND_CEIL),
        extra: Buffer.from(depositExtra),
        index_references: [0, 1],
        hash_references: [],
      });
    } else {
      depositExtra = buildComputerExtra(
        computerInfo.members.app_id,
        OperationTypeSystemCall,
        buildSystemCallInvoiceExtra(computerAccount.id, depositTrace, false)
      );

      attachStorageEntry(invoice, uniqueConversationID(depositTrace, "storage"), depositTxBuf);
      attachInvoiceEntry(invoice, {
        trace_id: uniqueConversationID(depositTrace, balance.asset_id),
        asset_id: balance.asset_id,
        amount: amount.toString(),
        extra: referenceExtra,
        index_references: [],
        hash_references: [],
      });

      attachInvoiceEntry(invoice, {
        trace_id: depositTrace,
        asset_id: XIN_ASSET_ID,
        amount: BigNumber(computerInfo.params.operation.price).toFixed(8, BigNumber.ROUND_CEIL),
        extra: Buffer.from(depositExtra),
        index_references: [0, 1],
        hash_references: [],
      });
    }
    console.log("depositExtra: ", depositExtra);
    console.log("depositTrace: ", depositTrace);
    resultTrace = depositTrace;
    return { resultTrace, invoice };
  } else if (txAction === TransactionType.BORROW) {
    const { needCreateAta, userAta } = await checkMarginfiAccountNeedCreateAta(
      marginfiClient,
      selectedBank,
      actionTxns.finalAccount,
      connection
    );

    // 2. borrow
    const borrowAddressLookupsRes = await Promise.all(
      (versionedTransactions[0] as VersionedTransaction).message.addressTableLookups.map((a) =>
        connection.getAddressLookupTable(a.accountKey)
      )
    );
    const borrowAddressLookups = borrowAddressLookupsRes
      .filter((r) => r.value)
      .map((r) => r.value) as AddressLookupTableAccount[];

    const borrowInx = TransactionMessage.decompile(versionedTransactions[0].message, {
      addressLookupTableAccounts: borrowAddressLookups,
    }).instructions;

    const nonce1 = await computerClient.getNonce(getUserMix());
    const nonce1Ins = SystemProgram.nonceAdvance({
      noncePubkey: new PublicKey(nonce1.nonce_address),
      authorizedPubkey: new PublicKey(computerInfo.payer),
    });
    const message1V0 = new TransactionMessage({
      payerKey: new PublicKey(computerInfo.payer),
      recentBlockhash: nonce1.nonce_hash,
      instructions: [nonce1Ins, ...borrowInx],
    }).compileToV0Message(borrowAddressLookups);

    const borrowTx = new VersionedTransaction(message1V0);
    if (updatedTransactions[0].signers) {
      borrowTx.sign(updatedTransactions[0].signers);
    }
    console.log("borrowTx: ", Buffer.from(borrowTx.serialize()).toString("base64"));
    const borrowTxBuf = Buffer.from(borrowTx.serialize());
    if (!checkSystemCallSize(borrowTxBuf)) {
      throw new Error("Transaction size exceeds limit");
    }
    const borrowTrace = uniqueConversationID(borrowTxBuf.toString("hex"), "system call");
    let borrowExtra: string;
    if (needCreateAta) {
      const solAmount = formatUnits(
        MARGINFI_ACCOUNT_BORROW_RENT_SIZES.reduce((prev, cur) => {
          const total = prev + rentMap[cur];
          return total;
        }, 0).toString(),
        SOL_DECIMAL
      ).toString();
      const fee = await computerClient.getFeeOnXin(solAmount);

      borrowExtra = buildComputerExtra(
        computerInfo.members.app_id,
        OperationTypeSystemCall,
        buildSystemCallInvoiceExtra(computerAccount.id, borrowTrace, false, fee.fee_id)
      );

      attachStorageEntry(invoice, uniqueConversationID(borrowTrace, "storage"), borrowTxBuf);
      attachInvoiceEntry(invoice, {
        trace_id: borrowTrace,
        asset_id: XIN_ASSET_ID,
        amount: add(computerInfo.params.operation.price, fee.xin_amount).toFixed(8, BigNumber.ROUND_CEIL),
        extra: Buffer.from(borrowExtra),
        index_references: [0],
        hash_references: [],
      });
    } else {
      borrowExtra = buildComputerExtra(
        computerInfo.members.app_id,
        OperationTypeSystemCall,
        buildSystemCallInvoiceExtra(computerAccount.id, borrowTrace, false)
      );
      attachStorageEntry(invoice, uniqueConversationID(borrowTrace, "storage"), borrowTxBuf);
      attachInvoiceEntry(invoice, {
        trace_id: borrowTrace,
        asset_id: XIN_ASSET_ID,
        amount: BigNumber(computerInfo.params.operation.price).toFixed(8, BigNumber.ROUND_CEIL),
        extra: Buffer.from(borrowExtra),
        index_references: [0],
        hash_references: [],
      });
    }

    console.log("borrowExtra: ", borrowExtra);
    console.log("borrowTrace: ", borrowTrace);
    resultTrace = borrowTrace;
    return { resultTrace, invoice };
  } else if (txAction === TransactionType.WITHDRAW) {
    const { needCreateAta, userAta } = await checkMarginfiAccountNeedCreateAta(
      marginfiClient,
      selectedBank,
      actionTxns.finalAccount,
      connection
    );
    // 2. withdraw
    const nonce1 = await computerClient.getNonce(getUserMix());
    const withdrawAddressLookupsRes = await Promise.all(
      (versionedTransactions[0] as VersionedTransaction).message.addressTableLookups.map((a) =>
        connection.getAddressLookupTable(a.accountKey)
      )
    );
    const withdrawAddressLookups = withdrawAddressLookupsRes
      .filter((r) => r.value)
      .map((r) => r.value) as AddressLookupTableAccount[];

    const withdrawInx = TransactionMessage.decompile(versionedTransactions[0].message, {
      addressLookupTableAccounts: withdrawAddressLookups,
    }).instructions;

    const nonce1Ins = SystemProgram.nonceAdvance({
      noncePubkey: new PublicKey(nonce1.nonce_address),
      authorizedPubkey: new PublicKey(computerInfo.payer),
    });

    const message1V0 = new TransactionMessage({
      payerKey: new PublicKey(computerInfo.payer),
      recentBlockhash: nonce1.nonce_hash,
      instructions: [nonce1Ins, ...withdrawInx],
    }).compileToV0Message(withdrawAddressLookups);

    const withdrawTx = new VersionedTransaction(message1V0);
    if (updatedTransactions[0].signers) {
      withdrawTx.sign(updatedTransactions[0].signers);
    }
    console.log("withdrawTx: ", withdrawTx);
    const withdrawTxBuf = Buffer.from(withdrawTx.serialize());
    if (!checkSystemCallSize(withdrawTxBuf)) {
      throw new Error("Transaction size exceeds limit");
    }
    const withdrawTrace = uniqueConversationID(withdrawTxBuf.toString("hex"), "system call");

    let withdrawExtra: string;
    if (needCreateAta) {
      const solAmount = formatUnits(
        MARGINFI_ACCOUNT_WITHDRAW_RENT_SIZES.reduce((prev, cur) => {
          const total = prev + rentMap[cur];
          return total;
        }, 0).toString(),
        SOL_DECIMAL
      ).toString();
      const fee = await computerClient.getFeeOnXin(solAmount);

      withdrawExtra = buildComputerExtra(
        computerInfo.members.app_id,
        OperationTypeSystemCall,
        buildSystemCallInvoiceExtra(computerAccount.id, withdrawTrace, false, fee.fee_id)
      );

      attachStorageEntry(invoice, uniqueConversationID(withdrawTrace, "storage"), withdrawTxBuf);
      attachInvoiceEntry(invoice, {
        trace_id: withdrawTrace,
        asset_id: XIN_ASSET_ID,
        amount: add(computerInfo.params.operation.price, fee.xin_amount).toFixed(8, BigNumber.ROUND_CEIL),
        extra: Buffer.from(withdrawExtra),
        index_references: [0],
        hash_references: [],
      });
    } else {
      withdrawExtra = buildComputerExtra(
        computerInfo.members.app_id,
        OperationTypeSystemCall,
        buildSystemCallInvoiceExtra(computerAccount.id, withdrawTrace, false)
      );
      attachStorageEntry(invoice, uniqueConversationID(withdrawTrace, "storage"), withdrawTxBuf);
      attachInvoiceEntry(invoice, {
        trace_id: withdrawTrace,
        asset_id: XIN_ASSET_ID,
        amount: BigNumber(computerInfo.params.operation.price).toFixed(8, BigNumber.ROUND_CEIL),
        extra: Buffer.from(withdrawExtra),
        index_references: [0],
        hash_references: [],
      });
    }
    console.log("withdrawExtra: ", withdrawExtra);
    console.log("withdrawTrace: ", withdrawTrace);
    resultTrace = withdrawTrace;
    return { resultTrace, invoice };
  }
  throw new Error(`Unsupported transaction type: ${txAction}`);
}

async function handleVxLength2({
  txAction,
  versionedTransactions,
  computerClient,
  getUserMix,
  computerInfo,
  connection,
  updatedTransactions,
  balanceAddressMap,
  selectedBank,
  marginfiClient,
  computerAccount,
  rentMap,
  invoice,
  amount,
  actionTxns,
}: HandleVxLength1Args): Promise<{
  resultTrace: string;
  invoice: MixinInvoice;
}> {
  let resultTrace = "";
  const referenceExtra = Buffer.from(
    buildComputerExtra(computerInfo.members.app_id, OperationTypeUserDeposit, userIdToBytes(computerAccount.id))
  );

  if (
    txAction === TransactionType.DEPOSIT &&
    updatedTransactions[0].type === TransactionType.CREATE_ACCOUNT &&
    updatedTransactions[1].type === TransactionType.DEPOSIT
  ) {
    // 1. init account
    const initAccountAddressLookupsRes = await Promise.all(
      (versionedTransactions[0] as VersionedTransaction).message.addressTableLookups.map((a) =>
        connection.getAddressLookupTable(a.accountKey)
      )
    );
    const initAccountAddressLookups = initAccountAddressLookupsRes
      .filter((r) => r.value)
      .map((r) => r.value) as AddressLookupTableAccount[];

    const createAccountInx = TransactionMessage.decompile(versionedTransactions[0].message, {
      addressLookupTableAccounts: initAccountAddressLookups,
    }).instructions;
    const nonce1 = await computerClient.getNonce(getUserMix());
    const nonce1Ins = SystemProgram.nonceAdvance({
      noncePubkey: new PublicKey(nonce1.nonce_address),
      authorizedPubkey: new PublicKey(computerInfo.payer),
    });
    const createAccountMessage = new TransactionMessage({
      payerKey: new PublicKey(computerInfo.payer),
      recentBlockhash: nonce1.nonce_hash,
      instructions: [nonce1Ins, ...createAccountInx],
    }).compileToV0Message(initAccountAddressLookups);

    const createAccountTx = new VersionedTransaction(createAccountMessage);
    if (updatedTransactions[0].signers) {
      createAccountTx.sign(updatedTransactions[0].signers);
    }

    const createAccountTxBuf = Buffer.from(createAccountTx.serialize());
    const createAccountTrace = uniqueConversationID(createAccountTxBuf.toString("hex"), "system call");
    const solAmount = formatUnits(
      MARGINFI_ACCOUNT_INITIALIZE_RENT_SIZES.reduce((prev, cur) => {
        const total = prev + rentMap[cur];
        return total;
      }, 0).toString(),
      SOL_DECIMAL
    ).toString();
    const fee = await computerClient.getFeeOnXin(solAmount);
    const initAccountExtra = buildComputerExtra(
      computerInfo.members.app_id,
      OperationTypeSystemCall,
      buildSystemCallInvoiceExtra(computerAccount.id, createAccountTrace, false, fee.fee_id)
    );

    attachStorageEntry(invoice, uniqueConversationID(createAccountTrace, "storage"), createAccountTxBuf);
    attachInvoiceEntry(invoice, {
      trace_id: createAccountTrace,
      asset_id: XIN_ASSET_ID,
      amount: add(computerInfo.params.operation.price, fee.xin_amount).toFixed(8, BigNumber.ROUND_CEIL),
      extra: Buffer.from(initAccountExtra),
      index_references: [0],
      hash_references: [],
    });

    // 2. deposit
    const nonce2 = await computerClient.getNonce(getUserMix());
    const depositAddressLookupsRes = await Promise.all(
      (versionedTransactions[1] as VersionedTransaction).message.addressTableLookups.map((a) =>
        connection.getAddressLookupTable(a.accountKey)
      )
    );
    const depositAddressLookups = depositAddressLookupsRes
      .filter((r) => r.value)
      .map((r) => r.value) as AddressLookupTableAccount[];

    const depositInx = TransactionMessage.decompile(versionedTransactions[1].message, {
      addressLookupTableAccounts: depositAddressLookups,
    }).instructions;

    const nonce2Ins = SystemProgram.nonceAdvance({
      noncePubkey: new PublicKey(nonce2.nonce_address),
      authorizedPubkey: new PublicKey(computerInfo.payer),
    });
    const message1V0 = new TransactionMessage({
      payerKey: new PublicKey(computerInfo.payer),
      recentBlockhash: nonce2.nonce_hash,
      instructions: [nonce2Ins, ...depositInx],
    }).compileToV0Message(depositAddressLookups);

    const depositTx = new VersionedTransaction(message1V0);
    if (updatedTransactions[1].signers) {
      depositTx.sign(updatedTransactions[1].signers);
    }
    console.log("depositTx: ", depositTx);
    // 5. 检查交易大小
    const depositTxBuf = Buffer.from(depositTx.serialize());
    if (!checkSystemCallSize(depositTxBuf)) {
      throw new Error("Transaction size exceeds limit");
    }
    console.log("depositTxBuf(base64): ", depositTxBuf.toString("base64"));

    const depositTrace = uniqueConversationID(depositTxBuf.toString("hex"), "system call");

    const depositExtra = buildComputerExtra(
      computerInfo.members.app_id,
      OperationTypeSystemCall,
      buildSystemCallInvoiceExtra(computerAccount.id, depositTrace, false)
    );

    const balance = balanceAddressMap[selectedBank.info.rawBank.mint.toBase58()];

    attachStorageEntry(invoice, uniqueConversationID(depositTrace, "storage"), depositTxBuf);
    attachInvoiceEntry(invoice, {
      trace_id: uniqueConversationID(depositTrace, balance.asset_id),
      asset_id: balance.asset_id,
      amount: amount.toString(),
      extra: referenceExtra,
      index_references: [],
      hash_references: [],
    });
    attachInvoiceEntry(invoice, {
      trace_id: depositTrace,
      asset_id: XIN_ASSET_ID,
      amount: BigNumber(computerInfo.params.operation.price).toFixed(8, BigNumber.ROUND_CEIL),
      extra: Buffer.from(depositExtra),
      index_references: [2, 3],
      hash_references: [],
    });

    console.log("depositExtra: ", depositExtra);
    console.log("depositTrace: ", depositTrace);
    resultTrace = depositTrace;
    return { resultTrace, invoice };
  } else if (
    txAction === TransactionType.BORROW &&
    updatedTransactions[0].type === TransactionType.CRANK &&
    updatedTransactions[1].type === TransactionType.BORROW
  ) {
    // 1. CRANK
    const crankAddressLookupsRes = await Promise.all(
      (versionedTransactions[0] as VersionedTransaction).message.addressTableLookups.map((a) =>
        connection.getAddressLookupTable(a.accountKey)
      )
    );
    const crankAddressLookups = crankAddressLookupsRes
      .filter((r) => r.value)
      .map((r) => r.value) as AddressLookupTableAccount[];

    const crankInx = TransactionMessage.decompile(versionedTransactions[0].message, {
      addressLookupTableAccounts: crankAddressLookups,
    }).instructions;
    const nonce1 = await computerClient.getNonce(getUserMix());
    const nonce1Ins = SystemProgram.nonceAdvance({
      noncePubkey: new PublicKey(nonce1.nonce_address),
      authorizedPubkey: new PublicKey(computerInfo.payer),
    });
    const crankMessage = new TransactionMessage({
      payerKey: new PublicKey(computerInfo.payer),
      recentBlockhash: nonce1.nonce_hash,
      instructions: [nonce1Ins, ...crankInx],
    }).compileToV0Message(crankAddressLookups);

    const crankTx = new VersionedTransaction(crankMessage);
    if (updatedTransactions[0].signers) {
      crankTx.sign(updatedTransactions[0].signers);
    }

    const crankTxBuf = Buffer.from(crankTx.serialize());
    const crankTrace = uniqueConversationID(crankTxBuf.toString("hex"), "system call");
    const fee = await computerClient.getFeeOnXin("0.0001"); // 0.0001 sol
    const crankExtra = buildComputerExtra(
      computerInfo.members.app_id,
      OperationTypeSystemCall,
      buildSystemCallInvoiceExtra(computerAccount.id, crankTrace, false, fee.fee_id)
    );

    attachStorageEntry(invoice, uniqueConversationID(crankTrace, "storage"), crankTxBuf);
    attachInvoiceEntry(invoice, {
      trace_id: crankTrace,
      asset_id: XIN_ASSET_ID,
      amount: add(computerInfo.params.operation.price, fee.xin_amount).toFixed(8, BigNumber.ROUND_CEIL),
      extra: Buffer.from(crankExtra),
      index_references: [0],
      hash_references: [],
    });
    console.log("crankExtra: ", crankExtra);
    console.log("crankTrace: ", crankTrace);
    // resultTrace = crankTrace;
    // 2. BORROW
    const nonce2 = await computerClient.getNonce(getUserMix());
    const borrowAddressLookupsRes = await Promise.all(
      (versionedTransactions[1] as VersionedTransaction).message.addressTableLookups.map((a) =>
        connection.getAddressLookupTable(a.accountKey)
      )
    );
    const borrowAddressLookups = borrowAddressLookupsRes
      .filter((r) => r.value)
      .map((r) => r.value) as AddressLookupTableAccount[];

    const borrowInx = TransactionMessage.decompile(versionedTransactions[1].message, {
      addressLookupTableAccounts: borrowAddressLookups,
    }).instructions;

    const nonce2Ins = SystemProgram.nonceAdvance({
      noncePubkey: new PublicKey(nonce2.nonce_address),
      authorizedPubkey: new PublicKey(computerInfo.payer),
    });
    const message1V0 = new TransactionMessage({
      payerKey: new PublicKey(computerInfo.payer),
      recentBlockhash: nonce2.nonce_hash,
      instructions: [nonce2Ins, ...borrowInx],
    }).compileToV0Message(borrowAddressLookups);

    const borrowTx = new VersionedTransaction(message1V0);
    if (updatedTransactions[1].signers) {
      borrowTx.sign(updatedTransactions[1].signers);
    }
    console.log("borrowTx: ", borrowTx);
    // 5. 检查交易大小
    const borrowTxBuf = Buffer.from(borrowTx.serialize());
    if (!checkSystemCallSize(borrowTxBuf)) {
      throw new Error("Transaction size exceeds limit");
    }
    console.log("borrowTxBuf(base64): ", borrowTxBuf.toString("base64"));

    const borrowTrace = uniqueConversationID(borrowTxBuf.toString("hex"), "system call");
    let borrowExtra: string;
    if (true) {
      let solAmount = formatUnits(
        MARGINFI_ACCOUNT_BORROW_RENT_SIZES.reduce((prev, cur) => {
          const total = prev + rentMap[cur];
          return total;
        }, 0).toString(),
        SOL_DECIMAL
      ).toString();
      const fee = await computerClient.getFeeOnXin(solAmount);
      borrowExtra = buildComputerExtra(
        computerInfo.members.app_id,
        OperationTypeSystemCall,
        buildSystemCallInvoiceExtra(computerAccount.id, borrowTrace, false, fee.fee_id)
      );
      attachStorageEntry(invoice, uniqueConversationID(borrowTrace, "storage"), borrowTxBuf);
      attachInvoiceEntry(invoice, {
        trace_id: borrowTrace,
        asset_id: XIN_ASSET_ID,
        amount: add(computerInfo.params.operation.price, fee.xin_amount).toFixed(8, BigNumber.ROUND_CEIL),
        extra: Buffer.from(borrowExtra),
        index_references: [2],
        hash_references: [],
      });
    } else {
      borrowExtra = buildComputerExtra(
        computerInfo.members.app_id,
        OperationTypeSystemCall,
        buildSystemCallInvoiceExtra(computerAccount.id, borrowTrace, false)
      );
      attachStorageEntry(invoice, uniqueConversationID(borrowTrace, "storage"), borrowTxBuf);
      attachInvoiceEntry(invoice, {
        trace_id: borrowTrace,
        asset_id: XIN_ASSET_ID,
        amount: BigNumber(computerInfo.params.operation.price).toFixed(8, BigNumber.ROUND_CEIL),
        extra: Buffer.from(borrowExtra),
        index_references: [2],
        hash_references: [],
      });
    }

    console.log("borrowExtra: ", borrowExtra);
    console.log("borrowTrace: ", borrowTrace);
    resultTrace = borrowTrace;
    return { resultTrace, invoice };
  } else if (
    txAction === TransactionType.WITHDRAW &&
    updatedTransactions[0].type === TransactionType.CRANK &&
    updatedTransactions[1].type === TransactionType.WITHDRAW
  ) {
    // 1. CRANK
    const crankAddressLookupsRes = await Promise.all(
      (versionedTransactions[0] as VersionedTransaction).message.addressTableLookups.map((a) =>
        connection.getAddressLookupTable(a.accountKey)
      )
    );
    const crankAddressLookups = crankAddressLookupsRes
      .filter((r) => r.value)
      .map((r) => r.value) as AddressLookupTableAccount[];

    const crankInx = TransactionMessage.decompile(versionedTransactions[0].message, {
      addressLookupTableAccounts: crankAddressLookups,
    }).instructions;
    const nonce1 = await computerClient.getNonce(getUserMix());
    const nonce1Ins = SystemProgram.nonceAdvance({
      noncePubkey: new PublicKey(nonce1.nonce_address),
      authorizedPubkey: new PublicKey(computerInfo.payer),
    });
    const crankMessage = new TransactionMessage({
      payerKey: new PublicKey(computerInfo.payer),
      recentBlockhash: nonce1.nonce_hash,
      instructions: [nonce1Ins, ...crankInx],
    }).compileToV0Message(crankAddressLookups);

    const crankTx = new VersionedTransaction(crankMessage);
    if (updatedTransactions[0].signers) {
      crankTx.sign(updatedTransactions[0].signers);
    }

    const crankTxBuf = Buffer.from(crankTx.serialize());
    const crankTrace = uniqueConversationID(crankTxBuf.toString("hex"), "system call");
    const fee = await computerClient.getFeeOnXin("0.0001"); // 0.0001 sol
    const crankExtra = buildComputerExtra(
      computerInfo.members.app_id,
      OperationTypeSystemCall,
      buildSystemCallInvoiceExtra(computerAccount.id, crankTrace, false, fee.fee_id)
    );

    attachStorageEntry(invoice, uniqueConversationID(crankTrace, "storage"), crankTxBuf);
    attachInvoiceEntry(invoice, {
      trace_id: crankTrace,
      asset_id: XIN_ASSET_ID,
      amount: add(computerInfo.params.operation.price, fee.xin_amount).toFixed(8, BigNumber.ROUND_CEIL),
      extra: Buffer.from(crankExtra),
      index_references: [0],
      hash_references: [],
    });
    console.log("crankExtra: ", crankExtra);
    console.log("crankTrace: ", crankTrace);
    resultTrace = crankTrace;

    // 2. withdraw
    // const { needCreateAta, userAta } = await checkMarginfiAccountNeedCreateAta(
    //   marginfiClient,
    //   selectedBank,
    //   actionTxns.finalAccount,
    //   connection
    // );

    // const nonce2 = await computerClient.getNonce(getUserMix());
    // const withdrawAddressLookupsRes = await Promise.all(
    //   (versionedTransactions[1] as VersionedTransaction).message.addressTableLookups.map((a) =>
    //     connection.getAddressLookupTable(a.accountKey)
    //   )
    // );
    // const withdrawAddressLookups = withdrawAddressLookupsRes
    //   .filter((r) => r.value)
    //   .map((r) => r.value) as AddressLookupTableAccount[];

    // const withdrawInx = TransactionMessage.decompile(versionedTransactions[1].message, {
    //   addressLookupTableAccounts: withdrawAddressLookups,
    // }).instructions;

    // const nonce2Ins = SystemProgram.nonceAdvance({
    //   noncePubkey: new PublicKey(nonce2.nonce_address),
    //   authorizedPubkey: new PublicKey(computerInfo.payer),
    // });

    // const message1V0 = new TransactionMessage({
    //   payerKey: new PublicKey(computerInfo.payer),
    //   recentBlockhash: nonce2.nonce_hash,
    //   instructions: [nonce2Ins, ...withdrawInx],
    // }).compileToV0Message(withdrawAddressLookups);

    // const withdrawTx = new VersionedTransaction(message1V0);
    // if (updatedTransactions[1].signers) {
    //   withdrawTx.sign(updatedTransactions[1].signers);
    // }
    // console.log("withdrawTx: ", withdrawTx);
    // const withdrawTxBuf = Buffer.from(withdrawTx.serialize());
    // if (!checkSystemCallSize(withdrawTxBuf)) {
    //   throw new Error("Transaction size exceeds limit");
    // }
    // const withdrawTrace = uniqueConversationID(withdrawTxBuf.toString("hex"), "system call");
    // let withdrawExtra: string;
    // if (true) {
    //   let solAmount = formatUnits(
    //     MARGINFI_ACCOUNT_WITHDRAW_RENT_SIZES.reduce((prev, cur) => {
    //       const total = prev + rentMap[cur];
    //       return total;
    //     }, 0).toString(),
    //     SOL_DECIMAL
    //   ).toString();
    //   const fee = await computerClient.getFeeOnXin(solAmount);

    //   withdrawExtra = buildComputerExtra(
    //     computerInfo.members.app_id,
    //     OperationTypeSystemCall,
    //     buildSystemCallInvoiceExtra(computerAccount.id, withdrawTrace, false, fee.fee_id)
    //   );

    //   attachStorageEntry(invoice, uniqueConversationID(withdrawTrace, "storage"), withdrawTxBuf);
    //   attachInvoiceEntry(invoice, {
    //     trace_id: withdrawTrace,
    //     asset_id: XIN_ASSET_ID,
    //     amount: add(computerInfo.params.operation.price, fee.xin_amount).toFixed(8, BigNumber.ROUND_CEIL),
    //     extra: Buffer.from(withdrawExtra),
    //     index_references: [2],
    //     hash_references: [],
    //   });
    // } else {
    //   withdrawExtra = buildComputerExtra(
    //     computerInfo.members.app_id,
    //     OperationTypeSystemCall,
    //     buildSystemCallInvoiceExtra(computerAccount.id, withdrawTrace, false)
    //   );
    //   attachStorageEntry(invoice, uniqueConversationID(withdrawTrace, "storage"), withdrawTxBuf);
    //   attachInvoiceEntry(invoice, {
    //     trace_id: withdrawTrace,
    //     asset_id: XIN_ASSET_ID,
    //     amount: BigNumber(computerInfo.params.operation.price).toFixed(8, BigNumber.ROUND_CEIL),
    //     extra: Buffer.from(withdrawExtra),
    //     index_references: [2],
    //     hash_references: [],
    //   });
    // }
    // console.log("withdrawExtra: ", withdrawExtra);
    // console.log("withdrawTrace: ", withdrawTrace);
    // resultTrace = withdrawTrace;
    return { resultTrace, invoice };
  } else {
    throw new Error(`Unsupported transaction type: ${txAction}`);
  }
}

// Check if need to create ata
async function checkMarginfiAccountNeedCreateAta(
  marginfiClient: MarginfiClient,
  selectedBank: ExtendedBankInfo,
  marginfiAccount: MarginfiAccountWrapper,
  connection: Connection
): Promise<{
  needCreateAta: boolean;
  userAta: PublicKey;
}> {
  if (!marginfiClient.mintDatas) {
    throw Error("Mint data not found");
  }

  const mintData = marginfiClient.mintDatas?.get(selectedBank.meta.address.toBase58());
  if (!mintData) throw Error(`Mint data for bank ${selectedBank.meta.address.toBase58()} not found`);

  const userAta = getAssociatedTokenAddressSync(
    selectedBank.info.rawBank.mint,
    marginfiAccount.authority,
    true,
    mintData.tokenProgram
  );
  const userAtaBalance = await connection.getAccountInfo(userAta);
  return {
    needCreateAta: userAtaBalance === null,
    userAta,
  };
}

async function checkWalletWSOLNeedCreateAta(
  marginfiClient: MarginfiClient,
  selectedBank: ExtendedBankInfo,
  connection: Connection
): Promise<{
  needCreateAta: boolean;
  userAta: PublicKey;
}> {
  if (selectedBank.info.rawBank.mint.toBase58() !== NATIVE_MINT.toBase58()) {
    return {
      needCreateAta: false,
      userAta: PublicKey.default,
    };
  }
  const userAta = getAssociatedTokenAddressSync(NATIVE_MINT, marginfiClient.wallet.publicKey);
  const userAtaBalance = await connection.getAccountInfo(userAta);
  return {
    needCreateAta: userAtaBalance === null,
    userAta,
  };
}

export { handleLendMixinSimulation };
