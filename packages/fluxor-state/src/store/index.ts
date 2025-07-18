import { StoreApi, UseBoundStore } from "zustand";
import { ComputerState, createComputerStore, computerClient } from "./useComputerStore";

const useComputerStore: UseBoundStore<StoreApi<ComputerState>> = createComputerStore();

export { computerClient };
export { useComputerStore };
