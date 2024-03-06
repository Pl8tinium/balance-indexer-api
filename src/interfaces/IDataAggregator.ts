import { AggregatedAccountBalanceDay } from '../models/AggregatedAccountBalanceDay';
import { IndexedAccount } from '../models/IndexedAccount';
import { Transaction } from '../models/Transaction';

export interface IDataAggregator {
  calculateAbsoluteBalanceForTxs(address: string, transactions: Array<Transaction>, currency: string, includeFees: boolean): number;
  aggregateDataByDay(accountsToAggregate: Array<IndexedAccount>, coin: string, includeFees?: boolean): Promise<void>;
  getAggregatedHistory(startDate: Date, endDate: Date, address: string, coin: string): Promise<Array<AggregatedAccountBalanceDay>>;
}
