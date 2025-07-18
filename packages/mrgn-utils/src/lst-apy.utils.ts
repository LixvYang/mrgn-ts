import { Readable } from "stream";
import { parse } from "csv-parse";

import { ExtendedBankInfo } from "@mrgnlabs/mrgn-state";

import { computeBankRateRaw } from "./mrgnUtils";
import { LendingModes } from "./types";

export const LSTS_SOLANA_COMPASS_MAP: {
  [key: string]: string;
} = {
  LST: "lst",
  bSOL: "solblaze",
  mSOL: "marinade",
  JitoSOL: "jito",
};

export type PriceRecord = {
  timestamp: number;
  epoch: number;
  price: number;
};

export type ApyCalcResult = {
  timestampStart: number;
  timestampEnd: number;
  epochs: number;
  apy: number;
};

export const calculateLstYield = async (bank: ExtendedBankInfo) => {
  const solanaCompassKey = LSTS_SOLANA_COMPASS_MAP[bank.meta.tokenSymbol];
  if (!solanaCompassKey) return 0;

  const response = await fetch(`/api/stakingApy?solanaCompassKey=${solanaCompassKey}`);
  if (!response.ok) return 0;

  const solanaCompassPrices = await response.json();
  return calcLstYield(solanaCompassPrices);
};

export const parsePriceRecordsFromCSV = async (csv: Readable): Promise<PriceRecord[]> => {
  const csvParser = parse({ delimiter: ",", columns: true });
  const records: PriceRecord[] = [];
  for await (const row of csv.pipe(csvParser)) {
    const { timestamp, epoch, price } = row;
    if (!timestamp || !epoch || !price) {
      throw new Error('Columns "timestamp", "epoch", "price" must be present!');
    }
    const record = {
      timestamp: Math.round(new Date(timestamp).getTime() / 1e3),
      epoch: Number(epoch),
      price: Number(price),
    };
    if (isNaN(record.timestamp)) {
      throw new Error("Timestamp must be a... timestamp!");
    }
    if (isNaN(record.epoch)) {
      throw new Error("Epoch must be a number!");
    }
    if (isNaN(record.price)) {
      throw new Error("Price must be a number!");
    }

    records.push(record);
  }
  return records;
};

export const fetchAndParsePricesCsv = async (url: string) => {
  const csvResponse = await fetch(url);
  const csvContents = await csvResponse.text();
  const prices = await parsePriceRecordsFromCSV(Readable.from([csvContents]));

  return prices;
};

const enum SECONDS_PER {
  DAY = 24 * 3600,
  YEAR = 365.25 * 24 * 3600,
}

export enum PERIOD {
  DAYS_7 = 7 * SECONDS_PER.DAY,
  DAYS_14 = 14 * SECONDS_PER.DAY,
  DAYS_30 = 30 * SECONDS_PER.DAY,
  DAYS_90 = 90 * SECONDS_PER.DAY,
  DAYS_365 = 365 * SECONDS_PER.DAY,
}

type PriceRange = {
  startPrice: number;
  endPrice: number;
  startTimestamp: number;
  endTimestamp: number;
  startEpoch: number;
  endEpoch: number;
};

export const getPriceRange = (
  priceRecords: PriceRecord[],
  startTimestamp: number,
  endTimestamp: number
): PriceRange | null => {
  priceRecords.sort((a, b) => b.timestamp - a.timestamp);

  let earliestRecord: PriceRecord | null = null;
  let latestRecord: PriceRecord | null = null;

  for (const record of priceRecords) {
    if (record.timestamp >= startTimestamp) {
      earliestRecord = record;
    }
    if (!latestRecord && record.timestamp <= endTimestamp) {
      latestRecord = record;
    }
    if (record.timestamp < startTimestamp) {
      break;
    }
  }

  if (!earliestRecord || !latestRecord) {
    return null;
  }

  if (earliestRecord.timestamp >= latestRecord.timestamp) {
    return null;
  }

  return {
    startPrice: earliestRecord.price,
    endPrice: latestRecord.price,
    startTimestamp: earliestRecord.timestamp,
    endTimestamp: latestRecord.timestamp,
    startEpoch: earliestRecord.epoch,
    endEpoch: latestRecord.epoch,
  };
};

export const getPriceRangeFromDates = (priceRecords: PriceRecord[], start: Date, end: Date) =>
  getPriceRange(priceRecords, Math.round(start.getTime() / 1e3), Math.round(end.getTime() / 1e3));

export const getPriceRangeFromPeriod = (
  priceRecords: PriceRecord[],
  periodSeconds = PERIOD.DAYS_30,
  end = new Date()
) => getPriceRangeFromDates(priceRecords, new Date(end.getTime() - periodSeconds * 1e3), end);

export type Yield = { apy: number; apr: number };

export const calcNetLoopingApy = (
  bank: ExtendedBankInfo,
  repayBank: ExtendedBankInfo,
  lstDepositApy: number,
  lstBorrowApy: number,
  leverageAmount: number
) => {
  const depositApy = computeBankRateRaw(bank, LendingModes.LEND);
  const borrowApy = computeBankRateRaw(repayBank, LendingModes.BORROW);

  const depositLstApy = lstDepositApy * leverageAmount;
  const borrowLstApy = lstBorrowApy * (leverageAmount - 1);

  const totalDepositApy = depositApy * leverageAmount;
  const totalBorrowApy = borrowApy * (leverageAmount - 1);

  const finalDepositApy = depositLstApy + totalDepositApy;
  const finalBorrowApy = borrowLstApy + totalBorrowApy;

  const netApy = finalDepositApy - finalBorrowApy;

  return {
    totalDepositApy,
    totalBorrowApy,
    depositLstApy,
    borrowLstApy,
    netApy,
  };
};

export const calcLstYield = (solanaCompassPrices: PriceRecord[]) => {
  const priceRange = getPriceRangeFromPeriod(solanaCompassPrices, PERIOD.DAYS_30);
  if (!priceRange) {
    return 0;
  }
  return calcYield(priceRange).apy;
};

export const calcYield = (priceRange: PriceRange): Yield => {
  if (priceRange.startPrice <= 0 || priceRange.endPrice <= 0) {
    throw new Error("Prices must be positive numbers!");
  }

  const deltaSeconds = priceRange.endTimestamp - priceRange.startTimestamp;
  if (deltaSeconds <= 0) {
    throw new Error("Start timestamp must be before end timestamp!");
  }

  const periodYield = priceRange.endPrice / priceRange.startPrice;
  const epochsPerPeriod = priceRange.endEpoch - priceRange.startEpoch;
  if (deltaSeconds <= 0) {
    throw new Error("At least 1 epoch must be in the range!");
  }

  const averageEpochDuration = deltaSeconds / epochsPerPeriod;
  const epochsPerYear = SECONDS_PER.YEAR / averageEpochDuration;
  const periodsPerYear = SECONDS_PER.YEAR / deltaSeconds;

  const averageEpochRate = periodYield ** (1 / epochsPerPeriod) - 1;

  const apy = periodYield ** periodsPerYear - 1;
  const apr = averageEpochRate * epochsPerYear;

  return {
    apy,
    apr,
  };
};
