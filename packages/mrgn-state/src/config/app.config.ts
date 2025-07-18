import { MARGINFI_IDL, MarginfiConfig, MarginfiIdlType, MarginfiProgram } from "@mrgnlabs/marginfi-client-v2";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { ConfirmOptions, Connection, Keypair, PublicKey } from "@solana/web3.js";

export interface AppConfig {
  mrgnConfig: MarginfiConfig;
  connection: Connection;
  program: MarginfiProgram;
  isMixin?: boolean;
}

let _config: AppConfig | null = null;

export interface AppConfigProps {
  mrgnConfig: MarginfiConfig;
  rpcUrl: string;
  confirmOpts?: ConfirmOptions;
  isMixin?: boolean;
}

export function initializeConfig(cfg: AppConfigProps) {
  if (_config) {
    // console.warn("AppConfig was already initialized; overwriting");
  } else {
    console.log("AppConfig initialized");

    const connection = new Connection(cfg.rpcUrl);
    const dummyWallet = {
      payer: new Keypair(),
      publicKey: PublicKey.default,
      signTransaction: () => new Promise(() => {}),
      signAllTransactions: () => new Promise(() => {}),
    } as Wallet;

    const programIdl: MarginfiIdlType = MARGINFI_IDL;

    const provider = new AnchorProvider(connection, dummyWallet, {
      ...AnchorProvider.defaultOptions(),
      commitment: connection.commitment ?? AnchorProvider.defaultOptions().commitment,
      ...cfg.confirmOpts,
    });

    const idl = { ...programIdl, address: cfg.mrgnConfig.programId.toBase58() };

    const program = new Program(idl, provider) as any as MarginfiProgram;

    _config = {
      mrgnConfig: cfg.mrgnConfig,
      connection,
      program,
      isMixin: cfg.isMixin,
    };
  }
}

export function getConfig(): AppConfig {
  if (!_config) {
    throw new Error("AppConfig not initialized! Call initializeConfig() first.");
  }
  return _config;
}
