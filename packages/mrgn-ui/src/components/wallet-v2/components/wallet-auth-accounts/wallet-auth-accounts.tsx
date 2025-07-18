import React from "react";

import { MarginfiAccountWrapper, MarginfiClient, ProcessTransactionsClientOpts } from "@mrgnlabs/marginfi-client-v2";
import { firebaseApi } from "@mrgnlabs/mrgn-state";
import { getMaybeSquadsOptions, capture } from "@mrgnlabs/mrgn-utils";
import { toastManager } from "@mrgnlabs/mrgn-toasts";
import { IconChevronDown, IconUserPlus, IconPencil, IconAlertTriangle, IconCopy, IconCheck } from "@tabler/icons-react";
import { Connection, PublicKey } from "@solana/web3.js";
import CopyToClipboard from "react-copy-to-clipboard";

import { cn } from "@mrgnlabs/mrgn-utils";
import { useWallet } from "~/components/wallet-v2";

import { Button } from "~/components/ui/button";
import { IconLoader } from "~/components/ui/icons";
import { Label } from "~/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { shortenAddress } from "@mrgnlabs/mrgn-common";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "~/components/ui/tooltip";

enum WalletAuthAccountsState {
  DEFAULT = "DEFAULT",
  ADD_ACCOUNT = "ADD_ACCOUNT",
  EDIT_ACCOUNT = "EDIT_ACCOUNT",
}

type WalletAuthAccountsProps = {
  mfiClient: MarginfiClient | null;
  connection: Connection | null;
  marginfiAccounts: PublicKey[];
  selectedAccount: MarginfiAccountWrapper | null;
  setSelectedAccount: (account: PublicKey) => void;
  processOpts?: ProcessTransactionsClientOpts;
  closeOnSwitch?: boolean;
  fullHeight?: boolean;
  popoverContentAlign?: "start" | "end" | "center";
  showAddAccountButton?: boolean;
  accountLabels?: Record<string, string>;
  fetchAccountLabels?: (accounts: PublicKey[]) => Promise<void>;
};

export const WalletAuthAccounts = ({
  mfiClient,
  connection,
  marginfiAccounts,
  selectedAccount,
  setSelectedAccount,
  closeOnSwitch = false,
  fullHeight = false,
  popoverContentAlign = "center",
  showAddAccountButton = true,
  processOpts,
  accountLabels,
  fetchAccountLabels,
}: WalletAuthAccountsProps) => {
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const { wallet, walletAddress, walletContextState } = useWallet();
  const [isActivatingAccount, setIsActivatingAccount] = React.useState<number | null>(null);
  const [isActivatingAccountDelay, setIsActivatingAccountDelay] = React.useState<number | null>(null);
  const [walletAuthAccountsState, setWalletAuthAccountsState] = React.useState<WalletAuthAccountsState>(
    WalletAuthAccountsState.DEFAULT
  );
  const [newAccountName, setNewAccountName] = React.useState<string>();
  const [editingAccount, setEditingAccount] = React.useState<PublicKey | null>(null);
  const [editingAccountName, setEditingAccountName] = React.useState<string>("");
  const [editAccountError, setEditAccountError] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [useAuthTxn, setUseAuthTxn] = React.useState(false);
  const [copiedAddresses, setCopiedAddresses] = React.useState<Set<string>>(new Set());
  const newAccountNameRef = React.useRef<HTMLInputElement>(null);
  const editAccountNameRef = React.useRef<HTMLInputElement>(null);

  const handleCopyAddress = React.useCallback((address: string) => {
    setCopiedAddresses((prev) => new Set(prev).add(address));
    setTimeout(() => {
      setCopiedAddresses((prev) => {
        const newSet = new Set(prev);
        newSet.delete(address);
        return newSet;
      });
    }, 1000);
  }, []);

  const activateAccount = React.useCallback(
    (account: PublicKey, index: number) => {
      if (selectedAccount && selectedAccount.address.equals(account)) return;
      setIsActivatingAccount(index);
      const switchingLabelTimer = setTimeout(() => setIsActivatingAccountDelay(index), 500);
      setSelectedAccount(account);

      clearTimeout(switchingLabelTimer);
      setIsActivatingAccount(null);
      setIsActivatingAccountDelay(null);
      capture("account_switched", { wallet: walletAddress.toBase58(), account: account.toBase58() });

      if (closeOnSwitch) {
        setPopoverOpen(false);
      }

      return () => clearTimeout(switchingLabelTimer);
    },
    [selectedAccount, setSelectedAccount, walletAddress, closeOnSwitch]
  );

  const checkAndClearAccountCache = React.useCallback(() => {
    const cacheTimestamp = localStorage.getItem("mrgnClearedAccountCache");
    const now = Date.now();
    const FIFTEEN_MINUTES = 15 * 60 * 1000; // 15 minutes in milliseconds

    if (!cacheTimestamp || now - parseInt(cacheTimestamp, 10) > FIFTEEN_MINUTES) {
      console.log("Clearing account cache and refetching accounts");
      fetchAccountLabels?.(marginfiAccounts);
      localStorage.setItem("mrgnClearedAccountCache", now.toString());
    }
  }, [fetchAccountLabels, marginfiAccounts]);

  const editAccount = React.useCallback(async () => {
    if (
      !connection ||
      !editingAccount ||
      !editingAccountName ||
      editingAccountName === accountLabels?.[editingAccount.toBase58()]
    ) {
      return;
    }

    setIsSubmitting(true);

    editAccountNameRef.current?.blur();

    const multiStepToast = toastManager.createMultiStepToast("Edit account", [{ label: "Updating account label" }]);
    multiStepToast.start();

    const blockhashInfo = await connection.getLatestBlockhash();

    const res = await firebaseApi.setAccountLabel(
      useAuthTxn ? "tx" : "memo",
      blockhashInfo,
      wallet,
      editingAccount.toBase58(),
      editingAccountName
    );

    if (!res) {
      multiStepToast.setFailed("Error updating account label");
      setIsSubmitting(false);
      return;
    }

    multiStepToast.successAndNext();
    setIsSubmitting(false);
    setEditingAccount(null);
    setEditingAccountName("");
    setEditAccountError("");
    fetchAccountLabels?.(marginfiAccounts);

    setWalletAuthAccountsState(WalletAuthAccountsState.DEFAULT);

    capture("account_label_updated", {
      wallet: walletAddress.toBase58(),
      account: editingAccount.toBase58(),
      label: editingAccountName,
    });
  }, [
    connection,
    editingAccount,
    editingAccountName,
    accountLabels,
    useAuthTxn,
    wallet,
    fetchAccountLabels,
    marginfiAccounts,
    walletAddress,
  ]);

  const createNewAccount = React.useCallback(async () => {
    if (!connection || !newAccountName || !mfiClient || !wallet.publicKey || newAccountName.length > 20) {
      return;
    }

    newAccountNameRef.current?.blur();

    const multiStepToast = toastManager.createMultiStepToast("Create new account", [
      { label: "Creating account" },
      { label: "Updating account label" },
    ]);
    multiStepToast.start();
    setIsSubmitting(true);

    try {
      const squadsOptions = await getMaybeSquadsOptions(walletContextState);
      const mfiAccount = await mfiClient.createMarginfiAccount(squadsOptions, processOpts);

      if (!mfiAccount) {
        multiStepToast.setFailed("Error creating new account");
        setIsSubmitting(false);
        return;
      }

      multiStepToast.successAndNext();

      const blockhashInfo = await connection.getLatestBlockhash();

      const res = await firebaseApi.setAccountLabel(
        useAuthTxn ? "tx" : "memo",
        blockhashInfo,
        wallet,
        mfiAccount.address.toBase58(),
        newAccountName
      );

      if (!res) {
        multiStepToast.setFailed("Error creating account label");
        setIsSubmitting(false);
        return;
      }

      multiStepToast.successAndNext();
      setIsSubmitting(false);
      setWalletAuthAccountsState(WalletAuthAccountsState.DEFAULT);
      await fetchAccountLabels?.(marginfiAccounts);
      activateAccount(mfiAccount.address, marginfiAccounts.length - 1);
      setNewAccountName(`Account ${marginfiAccounts.length + 1}`);

      capture("account_created", {
        wallet: mfiAccount.authority.toBase58(),
        account: mfiAccount.address.toBase58(),
        label: newAccountName,
      });
    } catch (error) {
      multiStepToast.setFailed("Error creating new account");
      setIsSubmitting(false);
    }
  }, [
    connection,
    newAccountName,
    mfiClient,
    wallet,
    walletContextState,
    processOpts,
    useAuthTxn,
    fetchAccountLabels,
    activateAccount,
    marginfiAccounts,
  ]);

  React.useEffect(() => {
    if (walletAuthAccountsState === WalletAuthAccountsState.ADD_ACCOUNT) {
      setNewAccountName(`Account ${marginfiAccounts.length + 1}`);
    }
  }, [walletAuthAccountsState, marginfiAccounts]);

  return (
    <div>
      <Popover
        onOpenChange={(open) => {
          if (open) {
            checkAndClearAccountCache();
          }
          setPopoverOpen(open);
        }}
        open={popoverOpen}
      >
        {selectedAccount && (
          <PopoverTrigger asChild>
            <Button variant="secondary" size="sm" className="text-sm">
              <span className="max-w-[80px] lg:max-w-[120px] truncate">
                {accountLabels?.[selectedAccount.address.toBase58()] || "Account"}
              </span>
              <IconChevronDown size={16} />
            </Button>
          </PopoverTrigger>
        )}
        <PopoverContent className="w-80 z-50" align={popoverContentAlign}>
          {walletAuthAccountsState === WalletAuthAccountsState.DEFAULT && (
            <div className="grid gap-4 w-[80]">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Your accounts</h4>
                <p className="text-sm text-muted-foreground">
                  {marginfiAccounts.length === 1
                    ? "Create another account below."
                    : "Manage your accounts or create a new one below."}
                </p>
              </div>
              <div
                className={cn(
                  "grid gap-2 max-h-[246px] overflow-y-auto relative",
                  fullHeight && "max-h-[calc(100vh-340px)]",
                  isActivatingAccount !== null && "pointer-events-none animate-pulsate"
                )}
              >
                {marginfiAccounts
                  .sort((a, b) => {
                    const indexA = Object.keys(accountLabels || {}).indexOf(a.toBase58());
                    const indexB = Object.keys(accountLabels || {}).indexOf(b.toBase58());
                    return indexA - indexB;
                  })
                  .map((account, index) => {
                    const isActiveAccount = selectedAccount && selectedAccount.address.equals(account);
                    const accountLabel = accountLabels?.[account.toBase58()] || `Account`;
                    return (
                      <div key={index} className="flex items-center justify-start gap-2">
                        <Button
                          key={index}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start pl-2 outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                            isActiveAccount && "cursor-default hover:bg-transparent"
                          )}
                          onClick={() => {
                            if (isActiveAccount) return;
                            activateAccount(account, index);
                          }}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Label
                                  htmlFor="width"
                                  className={cn(
                                    "pr-4 truncate overflow-hidden text-left",
                                    !isActiveAccount && "cursor-pointer"
                                  )}
                                >
                                  {accountLabel}
                                </Label>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{accountLabel}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <span id={account.toBase58()} className="text-muted-foreground text-[10px]">
                            {isActivatingAccountDelay === index ? "Switching..." : shortenAddress(account.toBase58())}
                          </span>

                          {isActivatingAccount === null && isActiveAccount && (
                            <Badge className="text-xs p-1 h-5">active</Badge>
                          )}
                        </Button>

                        <div className="flex items-center ml-auto">
                          <div
                            className="cursor-pointer flex py-2 px-1.5 items-center justify-center transition-colors rounded-md hover:bg-background-gray-light"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAccount(account);
                              setEditingAccountName(accountLabel);
                              setWalletAuthAccountsState(WalletAuthAccountsState.EDIT_ACCOUNT);
                            }}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <IconPencil size={16} />
                                </TooltipTrigger>
                                <TooltipContent>Edit account name</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div
                            className="cursor-pointer flex py-2 px-1.5 items-center justify-center transition-colors rounded-md hover:bg-background-gray-light"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    {copiedAddresses.has(account.toBase58()) ? (
                                      <IconCheck size={16} />
                                    ) : (
                                      <CopyToClipboard
                                        text={account.toBase58()}
                                        onCopy={() => handleCopyAddress(account.toBase58())}
                                      >
                                        <IconCopy size={16} />
                                      </CopyToClipboard>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {copiedAddresses.has(account.toBase58()) ? "Copied!" : "Copy account address"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              {showAddAccountButton && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (!newAccountName) {
                      setNewAccountName(`Account ${marginfiAccounts.length + 1}`);
                    }
                    setWalletAuthAccountsState(WalletAuthAccountsState.ADD_ACCOUNT);
                  }}
                >
                  <IconUserPlus size={16} className="mr-2" />
                  Add account
                </Button>
              )}
            </div>
          )}

          {walletAuthAccountsState === WalletAuthAccountsState.ADD_ACCOUNT && (
            <form
              className={cn("grid gap-4", isSubmitting && "pointer-events-none animate-pulsate")}
              onSubmit={(e) => {
                e.preventDefault();
                createNewAccount();
              }}
            >
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Your accounts</h4>
                <p className="text-sm text-muted-foreground">Create a new marginfi account.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accountName" className="font-medium">
                  Account name
                </Label>
                <Input
                  ref={newAccountNameRef}
                  type="text"
                  name="accountName"
                  value={newAccountName}
                  autoFocus
                  onChange={(e) => {
                    if (e.target.value.length > 20) return;
                    setNewAccountName(e.target.value);
                  }}
                  maxLength={20}
                />
              </div>
              <Label className="flex items-center gap-2 text-sm">
                <Checkbox checked={useAuthTxn} onCheckedChange={(checked) => setUseAuthTxn(checked as boolean)} />
                Using Ledger?
              </Label>
              <Button type="submit" className="w-full" onClick={() => {}} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <IconLoader size={16} /> Creating account...
                  </>
                ) : (
                  <>Create account</>
                )}
              </Button>
              {!isSubmitting && (
                <Button
                  variant="link"
                  size="sm"
                  className="text-destructive-foreground h-5"
                  onClick={(e) => {
                    e.preventDefault();
                    setWalletAuthAccountsState(WalletAuthAccountsState.DEFAULT);
                  }}
                >
                  Cancel
                </Button>
              )}
            </form>
          )}

          {walletAuthAccountsState === WalletAuthAccountsState.EDIT_ACCOUNT && (
            <form
              className={cn("grid gap-4", isSubmitting && "pointer-events-none animate-pulsate")}
              onSubmit={(e) => {
                e.preventDefault();
                editAccount();
              }}
            >
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Your accounts</h4>
                <p className="text-sm text-muted-foreground">Edit your marginfi account.</p>
              </div>
              {editAccountError && (
                <p className="flex items-center gap-2 bg-destructive p-2 text-destructive-foreground text-xs rounded-lg">
                  <IconAlertTriangle size={16} /> {editAccountError}
                </p>
              )}
              <div className="grid gap-2">
                <Label htmlFor="accountName" className="font-medium">
                  Account name
                </Label>
                <Input
                  ref={editAccountNameRef}
                  type="text"
                  name="accountName"
                  value={editingAccountName}
                  onChange={(e) => setEditingAccountName(e.target.value)}
                  autoFocus
                  maxLength={20}
                />
              </div>
              <Label className="flex items-center gap-2 text-sm">
                <Checkbox checked={useAuthTxn} onCheckedChange={(checked) => setUseAuthTxn(checked as boolean)} />
                Using Ledger?
              </Label>
              <Button type="submit" className="w-full">
                {isSubmitting ? (
                  <>
                    <IconLoader size={16} /> Updating account...
                  </>
                ) : (
                  <>Update account</>
                )}
              </Button>

              {!isSubmitting && (
                <Button
                  variant="link"
                  size="sm"
                  className="text-destructive-foreground h-5"
                  onClick={(e) => {
                    e.preventDefault();
                    setWalletAuthAccountsState(WalletAuthAccountsState.DEFAULT);
                  }}
                >
                  Cancel
                </Button>
              )}
            </form>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
