import { StoreApi, UseBoundStore } from "zustand";
import { ComputerState, createComputerStore, computerClient } from "./useComputerStore";
import { createFluxorStore, fluxorClient, FluxorState } from "./useFluxorStore";

const useComputerStore: UseBoundStore<StoreApi<ComputerState>> = createComputerStore();
const useFluxorStore: UseBoundStore<StoreApi<FluxorState>> = createFluxorStore();

export { useComputerStore, useFluxorStore };
export { computerClient, fluxorClient };
