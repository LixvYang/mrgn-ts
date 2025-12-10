import { useComputerStore } from "@mrgnlabs/fluxor-state";
import React from "react";
import { useAssetData } from "~/hooks/use-asset-data.hooks";

export default function EarnPage() {
    const { connected } = useComputerStore();
    const assetData = useAssetData();


  return (
    <>
      <div className="">
        Earn
      </div>
    </>
  );
}
