import { UserAssetBalance } from "@mrgnlabs/mrgn-common";
import { PublicKey } from "@solana/web3.js";

export interface MixinVars {
  isMixin: boolean;
  publicKey: PublicKey;
  connected: boolean;
  register: boolean;
  balanceAddressMap: Record<string, UserAssetBalance>;
}

let _mixinVars: MixinVars = {
  isMixin: false,
  publicKey: PublicKey.default,
  connected: false,
  register: false,
  balanceAddressMap: {},
};

export function initializeMixinVars(cfg: MixinVars) {
  _mixinVars = cfg;
}

export function resetMixinPublicKey(publicKey: PublicKey) {
  _mixinVars.publicKey = publicKey;
}

export function resetMixinBalanceAddressMap(balanceAddressMap: Record<string, UserAssetBalance>) {
  _mixinVars.balanceAddressMap = balanceAddressMap;
}

export function setMixin(isMixin: boolean) {
  _mixinVars.isMixin = isMixin;
}

export function resetMixinState(connected: boolean, register: boolean) {
  _mixinVars.connected = connected;
  _mixinVars.register = register;
}

export function getMixinVars(): MixinVars {
  // if (!_mixinVars) {
  //   throw new Error("MixinVars not initialized! Call initializeMixinVars() first.");
  // }
  return _mixinVars;
}
