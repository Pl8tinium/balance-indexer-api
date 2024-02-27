import { Collection } from 'mongodb';
import { Transaction } from '../models/Transaction';
import { IndexedAccount } from '../models/IndexedAccount';
import { IExplorerDataSupplicant } from '../interfaces/IExplorerDataSupplicant';
import { IDataService } from '../interfaces/IDataService';
import { IndexService } from '../indexService';
import { IDataAggregator } from '../interfaces/IDataAggregator';
import { AggregatedAccountBalanceDay } from '../models/AggregatedAccountBalanceDay';

// basically pipes through values, from a simple btc tx we cannot simply infer relationships to other chains
export class BtcDataService implements IDataService {
  btcRawData: Collection<Transaction>;
  btcIndexData: Collection<IndexedAccount>;
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
    this.btcRawData = btcRawData;
    this.btcIndexData = btcIndexData;
    this.apiAdapter = apiAdapter;
    this.indexService = indexService;
    this.dataAggregator = dataAggregator;

    this.apiAdapter.transactionOutput.on('newTransactions', async (newTransactions: Array<IndexedAccount>) => {
      await this.dataAggregator.aggregateDataByDay(newTransactions, this.apiAdapter.coin);
      await this.indexService.updateIndexedAccounts(newTransactions, this.apiAdapter.coin);
    });

    this.apiAdapter.start();
  }

  async getTransaction(txId: string): Promise<Transaction | null> {
    return (await this.btcRawData.findOne({
      txIds: txId,
    })) as Transaction | null;
  }

  async getAccountHistory(address: string): Promise<Array<Transaction>> {
    return await this.btcRawData.find({ address: address }).toArray();
  }

  async getBalanceHistory(startDate: Date, endDate: Date, address: string): Promise<Array<AggregatedAccountBalanceDay>> {
    return await this.dataAggregator.getAggregatedHistory(startDate, endDate, address, this.apiAdapter.coin);
  }
}
