
import { AggregatedAccountBalanceDay } from '../models/AggregatedAccountBalanceDay';
import { Transaction } from '../models/Transaction';

// services that retrieve the obtained data, inspect it for metadata (possible new indexes) and pass it onto the api
export interface IDataService {
  getTransaction(txId: string): Promise<Transaction | null>;
  getAccountHistory(address: string): Promise<Array<Transaction>>;
  getBalanceHistory(startDate: Date, endDate: Date, address: string): Promise<Array<AggregatedAccountBalanceDay>>;
}
