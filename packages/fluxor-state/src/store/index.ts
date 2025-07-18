import { StoreApi, UseBoundStore } from "zustand";
import { ComputerState, createComputerStore } from "./useComputerStore";

const useComputerStore: UseBoundStore<StoreApi<ComputerState>> = createComputerStore();

export { useComputerStore };
