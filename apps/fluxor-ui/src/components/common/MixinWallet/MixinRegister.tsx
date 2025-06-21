import { Avatar, AvatarImage, AvatarFallback } from "@mrgnlabs/mrgn-ui/src/components/ui/avatar";
import { Button } from "@mrgnlabs/mrgn-ui/src/components/ui/button";
import { useCallback, useState } from "react";
import { useAppStore } from "../../../store";
import { MixinLoginModal } from "./components/MixinLoginModal";
import { MixinRegisterModal } from "./components/MixinRegisterModal";

export default function MixinRegister(): React.FC {
  const { user, connected, register } = useAppStore((s) => ({
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
}
