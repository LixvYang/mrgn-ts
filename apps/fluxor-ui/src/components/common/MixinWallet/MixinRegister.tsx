import { Button } from "~/components/ui/button";
import { useCallback, useState } from "react";
import { useComputerStore } from "@mrgnlabs/fluxor-state";
import { MixinLoginModal } from "./components/MixinLoginModal";
import { MixinRegisterModal } from "./components/MixinRegisterModal";

export const MixinRegister = () => {
  const { user, connected, register } = useComputerStore((s) => ({
    user: s.user,
    connected: s.connected,
    register: s.register,
  }));

  const [show, setShow] = useState(false);
  const handleOpen = useCallback(() => setShow(true), [setShow]);
  const handleClose = useCallback(() => setShow(false), [setShow]);

  return (
    <div>
      {!user || !connected ? (
        <MixinLoginModal isOpen={show} onClose={handleClose} />
      ) : (
        !register && (
          <>
            <Button onClick={handleOpen}>Register</Button>
            <MixinRegisterModal isOpen={show} onClose={handleClose} />
          </>
        )
      )}
    </div>
  );
};
