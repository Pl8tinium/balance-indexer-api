import { Balance } from './Balance';

export interface AggregatedAccountBalanceDay {
  address: string;
  date: Date;
  netBalances: Array<Balance>;
  balanceDifferences: Array<Balance>;
}
