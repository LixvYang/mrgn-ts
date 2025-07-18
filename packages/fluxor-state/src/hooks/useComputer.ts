import { useEffect } from "react";
import { useComputerStore } from "../store";

function useComputer() {
  const [user, account, publicKey, getComputerInfo, getComputerAccount, getComputerAssets] = useComputerStore((s) => [
    s.user,
    s.account,
    s.publicKey,
    s.getComputerInfo,
    s.getComputerAccount,
    s.getComputerAssets,
  ]);

  useEffect(() => {
    if (user && !account) {
      const id = window.setInterval(() => {
        getComputerAccount();
      }, 60 * 1000);
      return () => window.clearInterval(id);
    }

    getComputerInfo();
    getComputerAssets();
    const id = window.setInterval(
      () => {
        getComputerInfo();
        getComputerAssets();
      },
      5 * 60 * 1000
    );
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, account]);

  useEffect(() => {
    if (!publicKey) return;
  }, [publicKey]);
}

export { useComputer };
