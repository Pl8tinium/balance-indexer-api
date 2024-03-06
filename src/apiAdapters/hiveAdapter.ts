import axios from 'axios';
import { IExplorerDataSupplicant } from '../interfaces/IExplorerDataSupplicant';
import { IndexedAccount } from '../models/IndexedAccount';
import { ExplorerDataSupplicant } from './explorerDataSupplicant';
import { IndexService } from '../indexService';
import { Collection } from 'mongodb';
import { TransactionTransfer } from '../models/TransactionOperation';
import { Transaction } from '../models/Transaction';

export class HiveAdapter extends ExplorerDataSupplicant implements IExplorerDataSupplicant {
  public coin: string = 'HIVE';
  private hiveRawData: Collection<Transaction>;

  constructor(hiveRawData: Collection<Transaction>, indexService: IndexService) {
    super(indexService);
    this.hiveRawData = hiveRawData;
  }

  async fetchTransactions(username: string, txHeightToStartFrom: number = 0, limit: number = 100, maxFetch?: number): Promise<any[]> {
    // pla: add limit, because the api works in a way that you fetch the previous items to the top tx height you supplied
    // concretly this means if you supply height 5 and limit 3, you get txs 2-5
    // if we want to get tx from 0 to 100 this means we supply 100, 100
    // if we want to start with the latest tx we dont do this and use -1 as the start height
    let txHeight = txHeightToStartFrom;
    if (txHeightToStartFrom != -1) {
      txHeight += limit;
    }
    let allData: any[] = [];
    let moreDataAvailable = true;

    while (moreDataAvailable) {
      try {        
        const payload = {
          jsonrpc: '2.0',
          method: 'condenser_api.get_account_history',
          params: [username, txHeight, limit],
          id: 1,
        };    

        const response = await axios.post(`https://api.hive.blog`, payload);
        const newData = response.data.result;
        
        // get last fetched tx's height and check if its the same as the txHeight we requested, if not we reached the end of the tx history
        if (txHeight != -1 && newData[newData.length - 1][0] != txHeight) {
          moreDataAvailable = false;
          // even though we know that we reached the end of the tx history, we still have to filter the received data
          // this is because hive sent us tx we already have, as we supplied a fixed limit
          const lastTxHeight = allData[allData.length - 1][0];
          allData = allData.concat(newData.filter((tx: any) => tx[0] > lastTxHeight));
        } else {
          allData = allData.concat(newData);
        }
        
        // If user specified maximum number of transactions to fetch, check if we've reached that number
        if (maxFetch && allData.length >= maxFetch) {
          moreDataAvailable = false;
        }
        txHeight += limit;
      } catch (error) {
        console.error('Error fetching data:', error);
        throw error; // Optionally re-throw or handle the error differently
      }
    }

    return allData;
  }

  async verifyFullState(indexedAccounts: IndexedAccount[]): Promise<IndexedAccount[]> {
    const addressesToUpdate: Array<IndexedAccount> = [];

    for (const indexedAccount of indexedAccounts) {
      const lastTx = await this.fetchTransactions(indexedAccount.address, -1, 1, 1);
      const parsedTx = this.parseToTransaction(lastTx[0]);

      if (!(await this.indexService.isTransactionIndexed(indexedAccount.address, parsedTx.id, this.coin))) {
        addressesToUpdate.push(indexedAccount);
      }
    }

    return addressesToUpdate;
  }

  splitHiveTransactionAmount(amount: string): { value: number; currency: string } {
    const parts = amount.split(' ');
    if (parts.length !== 2) {
        throw new Error('Invalid Hive transaction amount format');
    }
    const value = parseFloat(parts[0]);
    if (isNaN(value)) {
        throw new Error('Invalid numeric value in Hive transaction amount');
    }
    const currency = parts[1];
    return { value, currency };
}

  parseToTransaction(responseObj: any): Transaction {
    const data = responseObj[1];

    let inputs: Array<TransactionTransfer> = [];
    let outputs: Array<TransactionTransfer> = [];
    let additionalData: any = {};
    let aggregatable: boolean = false;

    if (['transfer', 'Transfer_to_vesting'].includes(data.op[0])) {
      const amount: { value: number; currency: string } = this.splitHiveTransactionAmount(data.op[1].amount);
      inputs = [
        {
          address: data.op[1].from,
          value: amount.value,
          currency: amount.currency,
        } as TransactionTransfer,
      ];
      outputs = [
        {
          address: data.op[1].to,
          value: amount.value,
          currency: amount.currency,
        } as TransactionTransfer,
      ];
      aggregatable = true;
    }
    else if (data.op[0] == 'account_update') {
      additionalData = data.op[1].json_metadata;
      inputs = [
        {
          address: data.op[1].account,
          value: 0,
        } as TransactionTransfer,
      ];
    }
    else {
      // pla: ... not sure if other operation's metadata is relevant
    }

    const transaction: Transaction = {
      id: data.trx_id,
      //fees: undefined, // Not available in Hive data
      confirmed: data.block > 0,
      blockHeight: data.block,
      timestamp: new Date(data.timestamp),
      inputs: inputs,
      outputs: outputs,
      additionalData: additionalData,
      aggregatable: aggregatable,
    } as any;

    return transaction;
  }

  async updateState(indexedAccounts: IndexedAccount[]): Promise<IndexedAccount[]> {
    const updatedAccounts: Array<IndexedAccount> = [];

    for (const indexedAccount of indexedAccounts) {
      const txHeightToStartFrom = await this.indexService.getTransactionCount(indexedAccount.address, this.coin);

      const newTxs = await this.fetchTransactions(indexedAccount.address, txHeightToStartFrom, 100, undefined);
      const parsedTxs = newTxs.map(this.parseToTransaction);

      await this.hiveRawData.insertMany(parsedTxs);

      updatedAccounts.push({
        address: indexedAccount.address,
        txIds: parsedTxs.map(tx => tx.id),
        lastUpdated: indexedAccount.lastUpdated,
      } as IndexedAccount);
    }

    return updatedAccounts;
  }
}
