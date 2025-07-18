import { useMixin, useComputer } from "@mrgnlabs/fluxor-state";
import { useMixinData } from "~/hooks/use-mixin-data.hooks";

const MixinProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  useMixin();
  useComputer();
  useMixinData();

  return <div>{children}</div>;
};

export { MixinProvider };
