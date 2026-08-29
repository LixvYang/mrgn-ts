/**
 * INPUT: Marginfi Anchor program, transaction arguments, and Solana account public keys
 * OUTPUT: Builders for marginfi v0.1.10 transaction instructions
 * POSITION: SDK instruction-construction boundary between client models and the on-chain program
 *
 * SYNC: If this file changes, update this header and ./folder.md
 */
import { AccountMeta, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import { TOKEN_PROGRAM_ID } from "@mrgnlabs/mrgn-common";

import { MarginfiProgram } from "./types";
import type { BankConfigCompactRaw, BankConfigOptRaw } from "./services";
import { getMarginfiRuntimeMethods } from "./anchor-runtime";

async function makeInitMarginfiAccountIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiGroup: PublicKey;
    marginfiAccount: PublicKey;
    authority: PublicKey;
    feePayer: PublicKey;
  }
) {
  return getMarginfiRuntimeMethods(mfProgram).marginfiAccountInitialize().accounts(accounts).instruction();
}

async function makeInitMarginfiAccountPdaIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiGroup: PublicKey;
    marginfiAccount: PublicKey;
    authority: PublicKey;
    feePayer: PublicKey;
  },
  args: {
    accountIndex: number;
    thirdPartyId?: number;
  }
) {
  return getMarginfiRuntimeMethods(mfProgram)
    .marginfiAccountInitializePda(args.accountIndex, args.thirdPartyId ?? null)
    .accountsPartial({
      marginfiGroup: accounts.marginfiGroup,
      marginfiAccount: accounts.marginfiAccount,
      authority: accounts.authority,
      feePayer: accounts.feePayer,
    })
    .instruction();
}

async function makeKaminoDepositIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiAccount: PublicKey;
    bank: PublicKey;
    signerTokenAccount: PublicKey;
    lendingMarket: PublicKey;
    reserveLiquidityMint: PublicKey;

    lendingMarketAuthority: PublicKey;
    reserveLiquiditySupply: PublicKey;
    reserveCollateralMint: PublicKey;
    reserveDestinationDepositCollateral: PublicKey;
    liquidityTokenProgram: PublicKey;

    obligationFarmUserState: PublicKey | null;
    reserveFarmState: PublicKey | null;

    // Optional accounts - to override inference
    group?: PublicKey;
    authority?: PublicKey;
    liquidityVault?: PublicKey;
    kaminoObligation?: PublicKey;
    kaminoReserve?: PublicKey;
    mint?: PublicKey;
  },
  args: {
    amount: BN;
    refreshReserve?: boolean;
  },
  remainingAccounts: AccountMeta[] = []
) {
  const {
    marginfiAccount,
    bank,
    signerTokenAccount,
    lendingMarket,
    reserveLiquidityMint,
    lendingMarketAuthority,
    reserveLiquiditySupply,
    reserveCollateralMint,
    reserveDestinationDepositCollateral,
    liquidityTokenProgram,
    obligationFarmUserState,
    reserveFarmState,
    ...optionalAccounts
  } = accounts;

  return getMarginfiRuntimeMethods(mfProgram)
    .kaminoDeposit(args.amount, args.refreshReserve ?? null)
    .accounts(accounts)
    .accountsPartial(optionalAccounts)
    .remainingAccounts(remainingAccounts)
    .instruction();
}

async function makeDepositIx(
  mfProgram: MarginfiProgram,
  accounts: {
    // Required accounts
    marginfiAccount: PublicKey;
    signerTokenAccount: PublicKey;
    bank: PublicKey;
    tokenProgram: PublicKey;
    // Optional accounts - to override inference
    group?: PublicKey;
    authority?: PublicKey;
    liquidityVault?: PublicKey;
  },
  args: {
    amount: BN;
    depositUpToLimit?: boolean;
  },
  remainingAccounts: AccountMeta[] = []
) {
  const { marginfiAccount, signerTokenAccount, bank, tokenProgram, ...optionalAccounts } = accounts;

  return getMarginfiRuntimeMethods(mfProgram)
    .lendingAccountDeposit(args.amount, args.depositUpToLimit ?? null)
    .accounts({
      marginfiAccount,
      signerTokenAccount,
      bank,
      tokenProgram,
    })
    .accountsPartial(optionalAccounts)
    .remainingAccounts(remainingAccounts)
    .instruction();
}

async function makeRepayIx(
  mfProgram: MarginfiProgram,
  accounts: {
    // Required accounts
    marginfiAccount: PublicKey;
    signerTokenAccount: PublicKey;
    bank: PublicKey;
    tokenProgram: PublicKey;
    // Optional accounts - to override inference
    group?: PublicKey;
    authority?: PublicKey;
    liquidityVault?: PublicKey;
  },
  args: {
    amount: BN;
    repayAll?: boolean;
  },
  remainingAccounts: AccountMeta[] = []
) {
  const { marginfiAccount, signerTokenAccount, bank, tokenProgram, ...optionalAccounts } = accounts;

  return getMarginfiRuntimeMethods(mfProgram)
    .lendingAccountRepay(args.amount, args.repayAll ?? null)
    .accounts({
      marginfiAccount,
      signerTokenAccount,
      bank,
      tokenProgram,
    })
    .accountsPartial(optionalAccounts)
    .remainingAccounts(remainingAccounts)
    .instruction();
}

async function makeKaminoWithdrawIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiAccount: PublicKey;
    bank: PublicKey;
    destinationTokenAccount: PublicKey;
    lendingMarket: PublicKey;
    reserveLiquidityMint: PublicKey;

    lendingMarketAuthority: PublicKey;
    reserveLiquiditySupply: PublicKey;
    reserveCollateralMint: PublicKey;
    reserveSourceCollateral: PublicKey;
    liquidityTokenProgram: PublicKey;

    obligationFarmUserState: PublicKey | null;
    reserveFarmState: PublicKey | null;

    // Optional accounts - to override inference
    group?: PublicKey;
    authority?: PublicKey;
  },
  args: {
    amount: BN;
    isFinalWithdrawal: boolean;
  },
  remainingAccounts: AccountMeta[] = []
) {
  const {
    marginfiAccount,
    bank,
    destinationTokenAccount,
    lendingMarket,
    reserveLiquidityMint,
    lendingMarketAuthority,
    reserveLiquiditySupply,
    reserveCollateralMint,
    reserveSourceCollateral,
    liquidityTokenProgram,
    obligationFarmUserState,
    reserveFarmState,
    ...optionalAccounts
  } = accounts;

  return getMarginfiRuntimeMethods(mfProgram)
    .kaminoWithdraw(args.amount, args.isFinalWithdrawal ? 1 : 0)
    .accounts({
      marginfiAccount,
      bank,
      destinationTokenAccount,
      lendingMarket,
      lendingMarketAuthority,
      reserveLiquiditySupply,
      reserveCollateralMint,
      reserveSourceCollateral,
      liquidityTokenProgram,
      obligationFarmUserState,
      reserveFarmState,
    })
    .accountsPartial({
      mint: reserveLiquidityMint,
      ...optionalAccounts,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}

async function makeWithdrawIx(
  mfProgram: MarginfiProgram,
  accounts: {
    // Required accounts
    marginfiAccount: PublicKey;
    bank: PublicKey;
    destinationTokenAccount: PublicKey;
    tokenProgram: PublicKey;
    // Optional accounts - to override inference
    group?: PublicKey;
    authority?: PublicKey;
  },
  args: {
    amount: BN;
    withdrawAll?: boolean;
  },
  remainingAccounts: AccountMeta[] = []
) {
  const { marginfiAccount, bank, destinationTokenAccount, tokenProgram, ...optionalAccounts } = accounts;

  return getMarginfiRuntimeMethods(mfProgram)
    .lendingAccountWithdraw(args.amount, args.withdrawAll ?? null)
    .accounts({
      marginfiAccount,
      destinationTokenAccount,
      bank,
      tokenProgram,
    })
    .accountsPartial(optionalAccounts)
    .remainingAccounts(remainingAccounts)
    .instruction();
}

async function makeBorrowIx(
  mfProgram: MarginfiProgram,
  accounts: {
    // Required accounts
    marginfiAccount: PublicKey;
    bank: PublicKey;
    destinationTokenAccount: PublicKey;
    tokenProgram: PublicKey;
    // Optional accounts - to override inference
    group?: PublicKey;
    authority?: PublicKey;
  },
  args: {
    amount: BN;
  },
  remainingAccounts: AccountMeta[] = []
) {
  const { marginfiAccount, bank, destinationTokenAccount, tokenProgram, ...optionalAccounts } = accounts;

  return getMarginfiRuntimeMethods(mfProgram)
    .lendingAccountBorrow(args.amount)
    .accounts({
      marginfiAccount,
      destinationTokenAccount,
      bank,
      tokenProgram,
    })
    .accountsPartial(optionalAccounts)
    .remainingAccounts(remainingAccounts)
    .instruction();
}

function makeLendingAccountLiquidateIx(
  mfiProgram: MarginfiProgram,
  accounts: {
    // Required accounts
    assetBank: PublicKey;
    liabBank: PublicKey;
    liquidatorMarginfiAccount: PublicKey;
    liquidateeMarginfiAccount: PublicKey;
    tokenProgram: PublicKey;
    // Optional accounts - to override inference
    group?: PublicKey;
    authority?: PublicKey;
  },
  args: {
    assetAmount: BN;
    liquidateeAccounts: number;
    liquidatorAccounts: number;
  },
  remainingAccounts: AccountMeta[] = []
) {
  const {
    assetBank,
    liabBank,
    liquidatorMarginfiAccount,
    liquidateeMarginfiAccount,
    tokenProgram,
    ...optionalAccounts
  } = accounts;

  return getMarginfiRuntimeMethods(mfiProgram)
    .lendingAccountLiquidate(args.assetAmount, args.liquidateeAccounts, args.liquidatorAccounts)
    .accounts({
      assetBank,
      liabBank,
      liquidatorMarginfiAccount,
      liquidateeMarginfiAccount,
      tokenProgram,
    })
    .accountsPartial(optionalAccounts)
    .remainingAccounts(remainingAccounts)
    .instruction();
}

/**
 * @deprecated Emissions withdrawals were removed from the marginfi program in v0.1.9.
 */
async function makelendingAccountWithdrawEmissionIx(
  _mfiProgram: MarginfiProgram,
  _accounts: {
    // Required accounts
    marginfiAccount: PublicKey;
    destinationAccount: PublicKey;
    bank: PublicKey;
    tokenProgram: PublicKey;
    // Optional accounts - to override inference
    group?: PublicKey;
    authority?: PublicKey;
    emissionsMint?: PublicKey;
  }
): Promise<never> {
  throw new Error("Emissions withdrawals are not supported by marginfi v0.1.10");
}

function makePoolConfigureBankIx(
  mfiProgram: MarginfiProgram,
  accounts: {
    // Required accounts
    bank: PublicKey;
    // Optional accounts - to override inference
    group?: PublicKey;
    admin?: PublicKey;
  },
  args: {
    bankConfigOpt: BankConfigOptRaw;
  }
) {
  const { bank, ...optionalAccounts } = accounts;
  // Anchor's generated MethodsNamespace exceeds TypeScript's instantiation
  // depth for the v0.1.10 BankConfigOpt. The public inputs above remain typed.
  const configureBank = getMarginfiRuntimeMethods(mfiProgram).lendingPoolConfigureBank;

  return configureBank(args.bankConfigOpt)
    .accounts({
      bank,
    })
    .accountsPartial(optionalAccounts)
    .instruction();
}

function makeBeginFlashLoanIx(
  mfiProgram: MarginfiProgram,
  accounts: {
    // Required accounts
    marginfiAccount: PublicKey;
    // Optional accounts - to override inference
    authority?: PublicKey;
    ixsSysvar?: PublicKey;
  },
  args: {
    endIndex: BN;
  }
) {
  const { marginfiAccount, ...optionalAccounts } = accounts;

  return getMarginfiRuntimeMethods(mfiProgram)
    .lendingAccountStartFlashloan(args.endIndex)
    .accounts({
      marginfiAccount,
    })
    .accountsPartial(optionalAccounts)
    .instruction();
}

function makeEndFlashLoanIx(
  mfiProgram: MarginfiProgram,
  accounts: {
    // Required accounts
    marginfiAccount: PublicKey;
    // Optional accounts - to override inference
    authority?: PublicKey;
  },
  remainingAccounts: AccountMeta[] = []
) {
  const { marginfiAccount, ...optionalAccounts } = accounts;

  return getMarginfiRuntimeMethods(mfiProgram)
    .lendingAccountEndFlashloan()
    .accounts({
      marginfiAccount,
    })
    .accountsPartial(optionalAccounts)
    .remainingAccounts(remainingAccounts)
    .instruction();
}

async function makeAccountTransferToNewAccountIx(
  mfProgram: MarginfiProgram,
  accounts: {
    // Required accounts
    oldMarginfiAccount: PublicKey;
    newMarginfiAccount: PublicKey;
    newAuthority: PublicKey;
    globalFeeWallet: PublicKey;
    feePayer: PublicKey;
    // Optional accounts - to override inference
    group?: PublicKey;
    authority?: PublicKey;
  }
) {
  const { oldMarginfiAccount, newMarginfiAccount, newAuthority, globalFeeWallet, feePayer, ...optionalAccounts } =
    accounts;

  return getMarginfiRuntimeMethods(mfProgram)
    .transferToNewAccount()
    .accounts({
      oldMarginfiAccount,
      newMarginfiAccount,
      newAuthority,
      globalFeeWallet,
      feePayer,
    })
    .accountsPartial(optionalAccounts)
    .instruction();
}

async function makeGroupInitIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiGroup: PublicKey;
    admin: PublicKey;
  },
  args?: {
    isArenaGroup?: boolean;
  }
) {
  return getMarginfiRuntimeMethods(mfProgram)
    .marginfiGroupInitialize()
    .accounts({
      marginfiGroup: accounts.marginfiGroup,
      admin: accounts.admin,
    })
    .instruction();
}

/**
 * Configure the oracle for a bank
 * @param mfProgram The marginfi program
 * @param accounts The accounts required for this instruction
 * @param args The oracle setup index and feed id
 * @param remainingAccounts The remaining accounts required for this instruction, should include the feed oracle key
 */
async function makeLendingPoolConfigureBankOracleIx(
  mfProgram: MarginfiProgram,
  accounts: {
    // Required accounts
    bank: PublicKey;
    // Optional accounts - to override inference
    group?: PublicKey;
    admin?: PublicKey;
  },
  args: {
    /**
     * The oracle setup index, see {@link serializeOracleSetupToIndex}
     */
    setup: number;
    /**
     * The oracle feed id
     */
    feedId: PublicKey;
  },
  /**
   * The remaining accounts required for this instruction, should include the feed oracle key (non writable & signable)
   */
  remainingAccounts: AccountMeta[] = []
) {
  const { bank, ...optionalAccounts } = accounts;

  return getMarginfiRuntimeMethods(mfProgram)
    .lendingPoolConfigureBankOracle(args.setup, args.feedId)
    .accounts({
      bank,
    })
    .accountsPartial(optionalAccounts)
    .remainingAccounts(remainingAccounts)
    .instruction();
}

/**
 * Creates an instruction to add a permissionless staked bank to a lending pool.
 * @param mfProgram - The marginfi program instance
 * @param accounts - The accounts required for this instruction
 * @param remainingAccounts - The remaining accounts required for this instruction, including pythOracle, solPool and bankMint
 * @param args - Optional arguments for this instruction
 */
async function makePoolAddPermissionlessStakedBankIx(
  mfProgram: MarginfiProgram,
  accounts: {
    // Required accounts
    stakedSettings: PublicKey;
    feePayer: PublicKey;
    bankMint: PublicKey;
    solPool: PublicKey;
    poolOnramp: PublicKey;
    stakePool: PublicKey;
    validatorVoteAccount: PublicKey;
    // Optional accounts - to override inference
    marginfiGroup?: PublicKey;
    /**
     * The token program to use for this instruction, defaults to the SPL token program
     */
    tokenProgram?: PublicKey;
  },
  /**
   * The remaining accounts required for this instruction. Should include:
   * - pythOracle: The pyth oracle key (non writable & non signer)
   * - solPool: The sol pool key (non writable & non signer)
   * - bankMint: The bank mint key (non writable & non signer)
   */
  remainingAccounts: AccountMeta[] = [],
  args: {
    /**
     * The seed to use for the bank account. Defaults to 0 (new BN(0)).
     * If the seed is not specified, the seed is set to 0, and the bank account
     * will be created at the address {@link findPoolAddress} with the default
     * bump.
     */
    seed?: BN;
  }
) {
  const {
    stakedSettings,
    feePayer,
    bankMint,
    solPool,
    poolOnramp,
    stakePool,
    validatorVoteAccount,
    tokenProgram = TOKEN_PROGRAM_ID,
    ...optionalAccounts
  } = accounts;

  return getMarginfiRuntimeMethods(mfProgram)
    .lendingPoolAddBankPermissionless(args.seed ?? new BN(0))
    .accounts({
      stakedSettings,
      feePayer,
      bankMint,
      solPool,
      poolOnramp,
      stakePool,
      validatorVoteAccount,
      tokenProgram,
    })
    .accountsPartial(optionalAccounts)
    .remainingAccounts(remainingAccounts)
    .instruction();
}

async function makePoolAddBankIx(
  mfProgram: MarginfiProgram,
  accounts: {
    // Required accounts
    marginfiGroup: PublicKey;
    feePayer: PublicKey;
    bankMint: PublicKey;
    bank: PublicKey;
    tokenProgram: PublicKey;
    // Optional accounts - to override inference
    admin?: PublicKey;
    globalFeeWallet?: PublicKey;
  },
  args: {
    bankConfig: BankConfigCompactRaw;
  }
) {
  const { marginfiGroup, feePayer, bankMint, bank, tokenProgram, ...optionalAccounts } = accounts;

  return getMarginfiRuntimeMethods(mfProgram)
    .lendingPoolAddBank({
      ...args.bankConfig,
      configFlags: 0,
      pad0: [0, 0, 0, 0, 0, 0, 0, 0],
    })
    .accounts({
      marginfiGroup,
      feePayer,
      bankMint,
      bank,
      tokenProgram,
    })
    .accountsPartial(optionalAccounts)
    .instruction();
}

async function makeCloseAccountIx(
  mfProgram: MarginfiProgram,
  accounts: {
    // Required accounts
    marginfiAccount: PublicKey;
    feePayer: PublicKey;
    // Optional accounts - to override inference
    authority?: PublicKey;
  }
) {
  const { marginfiAccount, feePayer, ...optionalAccounts } = accounts;
  return getMarginfiRuntimeMethods(mfProgram)
    .marginfiAccountClose()
    .accounts({
      marginfiAccount,
      feePayer,
    })
    .accountsPartial(optionalAccounts)
    .instruction();
}

// Deprecated
// async function makeLendingAccountSortBalancesIx(
//   mfProgram: MarginfiProgram,
//   accounts: {
//     marginfiAccount: PublicKey;
//   }
// ) {
//   return mfProgram.methods
//     .lendingAccountSortBalances()
//     .accounts({
//       marginfiAccount: accounts.marginfiAccount,
//     })
//     .instruction();
// }

async function makePulseHealthIx(
  mfProgram: MarginfiProgram,
  accounts: {
    marginfiAccount: PublicKey;
  },
  /**
   * The remaining accounts required for this instruction. Should include:
   * - For each balance the user has, pass bank and oracle: <bank1, oracle1, bank2, oracle2>
   */
  remainingAccounts: AccountMeta[] = []
) {
  return getMarginfiRuntimeMethods(mfProgram)
    .lendingAccountPulseHealth()
    .accounts({
      marginfiAccount: accounts.marginfiAccount,
    })
    .remainingAccounts(remainingAccounts)
    .instruction();
}

const instructions = {
  makeDepositIx,
  makeKaminoDepositIx,
  makeRepayIx,
  makeWithdrawIx,
  makeKaminoWithdrawIx,
  makeBorrowIx,
  makeInitMarginfiAccountIx,
  makeInitMarginfiAccountPdaIx,
  makeLendingAccountLiquidateIx,
  makelendingAccountWithdrawEmissionIx,
  makePoolAddBankIx,
  makePoolConfigureBankIx,
  makeBeginFlashLoanIx,
  makeEndFlashLoanIx,
  makeAccountTransferToNewAccountIx,
  makeGroupInitIx,
  makeCloseAccountIx,
  makePoolAddPermissionlessStakedBankIx,
  makeLendingPoolConfigureBankOracleIx,
  makePulseHealthIx,
};

export default instructions;
