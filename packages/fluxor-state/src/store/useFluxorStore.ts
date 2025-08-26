import { create, StateCreator } from "zustand";
import { persist, PersistOptions, devtools } from "zustand/middleware";
import { FluxorGlobalStatisticsResponse, FluxorBankTvlApyResponse } from "@mrgnlabs/mrgn-common";
import { initFluxorClient } from "../fluxor";

const fluxorClient = initFluxorClient();

// 缓存时间配置（毫秒）
const CACHE_DURATION = {
  GLOBAL_STATISTICS: 5 * 60 * 1000, // 5分钟
  TVL_APY: 5 * 60 * 1000, // 5分钟
};

interface FluxorState {
  // State
  globalStatistics: Record<
    string,
    {
      data: FluxorGlobalStatisticsResponse;
      lastFetchTime: number;
    }
  >;
  tvlApy: Record<
    string,
    {
      data: FluxorBankTvlApyResponse;
      lastFetchTime: number;
    }
  >;

  // Actions
  getGlobalStatistics: (groupAddress: string, forceRefresh?: boolean) => Promise<FluxorGlobalStatisticsResponse | null>;
  getTvlApy: (
    groupAddress: string,
    bankAddress: string,
    day: number,
    forceRefresh?: boolean
  ) => Promise<FluxorBankTvlApyResponse | null>;
  clearCache: () => void;
  clearGlobalStatisticsCache: (groupAddress?: string) => void;
  clearTvlApyCache: (groupAddress?: string, bankAddress?: string) => void;
}

const initFluxorState = {
  globalStatistics: {},
  tvlApy: {},
};

type FluxorStorePersist = (
  config: StateCreator<FluxorState>,
  options: PersistOptions<FluxorState, Pick<FluxorState, "globalStatistics" | "tvlApy">>
) => StateCreator<FluxorState>;

const createFluxorStore = () => {
  return create<FluxorState>()(
    devtools(
      (persist as FluxorStorePersist)(
        (set: (state: Partial<FluxorState>) => void, get: () => FluxorState) => ({
          // State
          ...initFluxorState,

          // Actions
          getGlobalStatistics: async (groupAddress: string, forceRefresh: boolean = false) => {
            const { globalStatistics } = get();
            const cacheKey = groupAddress;
            const cached = globalStatistics[cacheKey];

            // 检查缓存是否有效
            if (!forceRefresh && cached && Date.now() - cached.lastFetchTime < CACHE_DURATION.GLOBAL_STATISTICS) {
              //   console.log("📊 Using cached global statistics for:", groupAddress);
              return cached.data;
            }

            try {
              //   console.log("🔄 Fetching global statistics for:", groupAddress);
              const data = await fluxorClient.fetchGlobalStatistics(groupAddress);

              if (data) {
                set({
                  globalStatistics: {
                    ...globalStatistics,
                    [cacheKey]: {
                      data,
                      lastFetchTime: Date.now(),
                    },
                  },
                });
                // console.log("✅ Global statistics updated for:", groupAddress);
                return data;
              }
            } catch (error) {
              console.error("❌ Failed to fetch global statistics:", error);

              // 如果有缓存数据，在请求失败时返回缓存数据
              if (cached) {
                console.log("⚠️ Returning cached data due to fetch failure");
                return cached.data;
              }
            }

            return null;
          },

          getTvlApy: async (groupAddress: string, bankAddress: string, day: number, forceRefresh: boolean = false) => {
            const { tvlApy } = get();
            const cacheKey = `${groupAddress}-${bankAddress}-${day}`;
            const cached = tvlApy[cacheKey];

            // 检查缓存是否有效
            if (!forceRefresh && cached && Date.now() - cached.lastFetchTime < CACHE_DURATION.TVL_APY) {
              console.log("📊 Using cached TVL/APY for:", cacheKey);
              return cached.data;
            }

            try {
              console.log("🔄 Fetching TVL/APY for:", cacheKey);
              const data = await fluxorClient.fetchTvlApy(groupAddress, bankAddress, day);

              if (data) {
                set({
                  tvlApy: {
                    ...tvlApy,
                    [cacheKey]: {
                      data,
                      lastFetchTime: Date.now(),
                    },
                  },
                });
                console.log("✅ TVL/APY updated for:", cacheKey);
                return data;
              }
            } catch (error) {
              console.error("❌ Failed to fetch TVL/APY:", error);

              // 如果有缓存数据，在请求失败时返回缓存数据
              if (cached) {
                console.log("⚠️ Returning cached data due to fetch failure");
                return cached.data;
              }
            }

            return null;
          },

          clearCache: () => {
            set({
              globalStatistics: {},
              tvlApy: {},
            });
            console.log("🗑️ All fluxor cache cleared");
          },

          clearGlobalStatisticsCache: (groupAddress?: string) => {
            const { globalStatistics } = get();

            if (groupAddress) {
              // 清除特定 group 的缓存
              const newCache = { ...globalStatistics };
              delete newCache[groupAddress];
              set({ globalStatistics: newCache });
              console.log("🗑️ Global statistics cache cleared for:", groupAddress);
            } else {
              // 清除所有 global statistics 缓存
              set({ globalStatistics: {} });
              console.log("🗑️ All global statistics cache cleared");
            }
          },

          clearTvlApyCache: (groupAddress?: string, bankAddress?: string) => {
            const { tvlApy } = get();

            if (groupAddress && bankAddress) {
              // 清除特定 bank 的缓存
              const newCache = { ...tvlApy };
              Object.keys(newCache).forEach((key) => {
                if (key.startsWith(`${groupAddress}-${bankAddress}-`)) {
                  delete newCache[key];
                }
              });
              set({ tvlApy: newCache });
              console.log("🗑️ TVL/APY cache cleared for:", `${groupAddress}-${bankAddress}`);
            } else if (groupAddress) {
              // 清除特定 group 的所有 bank 缓存
              const newCache = { ...tvlApy };
              Object.keys(newCache).forEach((key) => {
                if (key.startsWith(`${groupAddress}-`)) {
                  delete newCache[key];
                }
              });
              set({ tvlApy: newCache });
              console.log("🗑️ TVL/APY cache cleared for group:", groupAddress);
            } else {
              // 清除所有 TVL/APY 缓存
              set({ tvlApy: {} });
              console.log("🗑️ All TVL/APY cache cleared");
            }
          },
        }),

        {
          name: "fluxorStore",
          // 只持久化缓存数据，不持久化时间戳
          partialize: (state) => ({
            globalStatistics: Object.fromEntries(
              Object.entries(state.globalStatistics).map(([key, value]) => [
                key,
                { data: value.data, lastFetchTime: 0 }, // 重置时间戳，强制重新验证缓存
              ])
            ),
            tvlApy: Object.fromEntries(
              Object.entries(state.tvlApy).map(([key, value]) => [
                key,
                { data: value.data, lastFetchTime: 0 }, // 重置时间戳，强制重新验证缓存
              ])
            ),
          }),
        }
      )
    )
  );
};

export { fluxorClient, createFluxorStore };
export type { FluxorState };
