import { useEffect } from "react";
import { useComputerStore } from "../store";

const useMixin = () => {
  const [user, updateBalances, computerAssets] = useComputerStore((s) => [s.user, s.updateBalances, s.computerAssets]);

  useEffect(() => {
    if (!user) return;
    updateBalances(computerAssets);
    const id = window.setInterval(() => {
      updateBalances(computerAssets);
    }, 60 * 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, computerAssets]);
};

export { useMixin };
