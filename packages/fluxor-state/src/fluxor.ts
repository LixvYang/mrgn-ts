import axios, { type AxiosResponse } from "axios";
import axiosRetry from "axios-retry";
import type {
  CallComputerRequest,
  FluxorBankTvlApyResponse,
  FluxorGlobalStatisticsResponse,
} from "@mrgnlabs/mrgn-common";
import { FLUXOR_HOST, getEnvConfig } from "./constants";

axios.defaults.headers.post["Content-Type"] = "application/json";

export const initFluxorClient = (responseCallback?: (e: any) => void) => {
  const ins = axios.create({
    baseURL: FLUXOR_HOST,
    timeout: 1000 * 60 * 10,
  });

  ins.interceptors.response.use(async (res: AxiosResponse) => {
    return res.data;
  });

  ins.interceptors.response.use(undefined, async (e: any) => {
    if (e.response.status === 404) return undefined;
    responseCallback?.(e);
    return Promise.reject(e);
  });

  axiosRetry(ins, {
    retries: 5,
    shouldResetTimeout: true,
    retryDelay: () => 500,
  });

  return {
    fetchTvlApy: (groupAddress: string, bankAddress: string, day: number): Promise<FluxorBankTvlApyResponse> =>
      ins.get(`/tvl-apy?groupAddress=${groupAddress}&bankAddress=${bankAddress}&day=${day}`),
    fetchGlobalStatistics: (groupAddress: string): Promise<FluxorGlobalStatisticsResponse> =>
      ins.get(`/global-statistics?groupAddress=${groupAddress}`),
    callComputer: (request: CallComputerRequest[]): Promise<any> => ins.post("/computer/call", request),
  };
};
