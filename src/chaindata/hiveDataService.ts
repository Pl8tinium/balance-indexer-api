// pipes through values and inspects the tx for relationships to other chain's addresses that we then index

import { Collection } from 'mongodb';
import { IndexService } from '../indexService';
import { IDataAggregator } from '../interfaces/IDataAggregator';
import { IDataService } from '../interfaces/IDataService';
import { IExplorerDataSupplicant } from '../interfaces/IExplorerDataSupplicant';
import { AggregatedAccountBalanceDay } from '../models/AggregatedAccountBalanceDay';
import { IndexedAccount } from '../models/IndexedAccount';
import { Transaction } from '../models/Transaction';

export class HiveDataService implements IDataService {
  hiveRawData: Collection<Transaction>;
  hiveIndexData: Collection<IndexedAccount>;
  apiAdapter: IExplorerDataSupplicant;
  indexService: IndexService;
  dataAggregator: IDataAggregator;

  constructor(
    btcRawData: Collection<Transaction>,
    btcIndexData: Collection<IndexedAccount>,
    apiAdapter: IExplorerDataSupplicant,
    indexService: IndexService,
    dataAggregator: IDataAggregator
  ) {
    this.hiveRawData = btcRawData;
    this.hiveIndexData = btcIndexData;
    this.apiAdapter = apiAdapter;
    this.indexService = indexService;
    this.dataAggregator = dataAggregator;

    this.apiAdapter.transactionOutput.on('newTransactions', async (newTransactions: Array<IndexedAccount>) => {
      await this.dataAggregator.aggregateDataByDay(newTransactions, this.apiAdapter.coin, false);
      await this.indexService.updateIndexedAccounts(newTransactions, this.apiAdapter.coin);
    });

    this.apiAdapter.start();
  }

  async getTransaction(txId: string): Promise<Transaction | null> {
    return (await this.hiveRawData.findOne({
      txIds: txId,
    })) as Transaction | null;
  }

  async getAccountHistory(address: string): Promise<Transaction[]> {
    return await this.hiveRawData.find({ address: address }).toArray();
  }

  async getBalanceHistory(startDate: Date, endDate: Date, address: string): Promise<AggregatedAccountBalanceDay[]> {
    return await this.dataAggregator.getAggregatedHistory(startDate, endDate, address, this.apiAdapter.coin);
  }
}
