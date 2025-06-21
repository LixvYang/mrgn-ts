import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { useAppStore } from "~/store";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { QrCode } from "~/components/Qrcode";
import { useCallback, useEffect, useState } from "react";
import { Buffer } from "buffer";
import { buildComputerExtra, OperationTypeAddUser } from "@mixin.dev/mixin-node-sdk";
import { buildMixAddress, encodeMtgExtra } from "@mixin.dev/mixin-node-sdk";
import Link from "next/link";

export function MixinRegisterModal(props: { isOpen: boolean; onClose: () => void }): JSX.Element {
  const { info, getUserMix, getMe, register } = useAppStore((s) => ({
    info: s.info,
    getUserMix: s.getUserMix,
    getMe: s.getMe,
    register: s.register,
  }));

  const [paymentUrl, setPaymentUrl] = useState("");

  const handleRegister = useCallback(() => {
    if (!getUserMix || !info) return;
    const userMix = getUserMix();
    if (!userMix) return;

    const extra = buildComputerExtra(OperationTypeAddUser, Buffer.from(userMix));
    const memo = encodeMtgExtra(info.members.app_id, extra);

    const destination = buildMixAddress({
      version: 2,
      xinMembers: [],
      uuidMembers: info.members.members,
      threshold: info.members.threshold,
    });

    const url = `https://mixin.one/pay/${destination}?amount=${info.params.operation.price}&asset=${info.params.operation.asset}&memo=${memo}`;
    setPaymentUrl(url);
  }, [info, getUserMix]);

  useEffect(() => {
    if (props.isOpen) {
      handleRegister();
    }
  }, [props.isOpen, handleRegister]);

  useEffect(() => {
    if (!props.isOpen || !paymentUrl) return;

    if (register) {
      props.onClose();
      return;
    }

    const intervalId = setInterval(() => {
      getMe();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [props.isOpen, paymentUrl, register, getMe, props.onClose]);

  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setPaymentUrl("");
        }
        props.onClose();
      }}
    >
      <DialogContent className="sm:max-w-[378px] bg-gray-600 border-colors-border">
        <DialogHeader>
          <DialogTitle>Mixin Register</DialogTitle>
        </DialogHeader>

        <div className="w-[300px] h-[300px] mx-auto">
          {paymentUrl ? (
            <div className="flex flex-col items-center justify-center">
              <QrCode value={paymentUrl} className="w-full h-full" />
              <Link href={paymentUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="default" size="lg" className="mt-4 w-full">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  Scan to Register
                </Button>
              </Link>
            </div>
          ) : (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
