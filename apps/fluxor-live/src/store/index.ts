import { UseBoundStore, StoreApi } from "zustand";
import { AppState, createAppStore } from "./useAppStore";

const useAppStore: UseBoundStore<StoreApi<AppState>> = createAppStore();
export { useAppStore };
