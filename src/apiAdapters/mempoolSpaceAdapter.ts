import axios from 'axios';
import { IExplorerDataSupplicant } from '../interfaces/IExplorerDataSupplicant';
import { Collection } from 'mongodb';
import { Transaction } from '../models/Transaction';
import { IndexService } from '../indexService';
import { IndexedAccount } from '../models/IndexedAccount';
import EventEmitter from 'events';
import { ExplorerDataSupplicant } from './explorerDataSupplicant';
import { DbAdapter } from '../dbAdapter';
import { TransactionTransfer } from '../models/TransactionOperation';

// this adapter fetches btc data
export class MempoolSpaceAdapter extends ExplorerDataSupplicant implements IExplorerDataSupplicant {
  public coin: string = 'BTC';
  private btcRawData: Collection<Transaction>;

  constructor(btcRawData: Collection<Transaction>, indexService: IndexService) {
    super(indexService);
    this.btcRawData = btcRawData;
  }

  async getTxCount(walletAddress: string): Promise<number> {
    try {
      const response = await axios.get(`https://mempool.space/api/address/${walletAddress}`);
      return response.data.chain_stats.tx_count;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error; // Optionally re-throw or handle the error differently
    }
  }

  // Function to recursively fetch all pages of data
  async fetchTransactions(walletAddress: string, txToStartFrom: string = ''): Promise<any[]> {
    const limit = 50; // max number of items a request may contain, specified by the api
    let allData: any[] = [];
    let moreDataAvailable = true;
    let lastTxId = txToStartFrom || '';

    while (moreDataAvailable) {
      try {
        const response = await axios.get(`https://mempool.space/api/address/${walletAddress}/txs?after_txid=${lastTxId}`);
        const newData = response.data;
        allData = allData.concat(newData);

        // Check if we received fewer items than we requested, indicating we've reached the end
        if (newData.length < limit) {
          moreDataAvailable = false;
        } else {
          lastTxId = newData[newData.length - 1].txid;
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        throw error; // Optionally re-throw or handle the error differently
      }
    }

    return allData;
  }

  async verifyFullState(indexedAccounts: Array<IndexedAccount>): Promise<Array<IndexedAccount>> {
    const addressesToUpdate: Array<IndexedAccount> = [];

    for (const indexedAccount of indexedAccounts) {
      const txCount = await this.getTxCount(indexedAccount.address);

      // if it doesnt exist the address needs to be updated
      if (indexedAccount.txIds.length < txCount) {
        addressesToUpdate.push(indexedAccount);
      }
    }

    return addressesToUpdate;
  }

  parseToTransaction(responseObj: any): Transaction {
    const data = responseObj;

    const transaction: Transaction = {
      id: data.txid,
      fees: data.fee,
      confirmed: data.status.confirmed,
      blockHeight: data.status.block_height,
      timestamp: new Date(data.status.block_time * 1000), // Convert Unix timestamp to Date
      inputs: data.vin.map(
        (input: any) =>
          ({
            address: input.prevout.scriptpubkey_address,
            value: input.prevout.value,
            currency: 'BTC'
          }) as TransactionTransfer
      ),
      outputs: data.vout.map(
        (output: any) =>
          ({
            address: output.scriptpubkey_address,
            value: output.value,
            currency: 'BTC'
          }) as TransactionTransfer
      ),
      aggregatable: true,
      // additionalData: { size: data.size, weight: data.weight, sigops: data.sigops },
    };

    return transaction;
  }

  async updateState(indexedAccounts: Array<IndexedAccount>): Promise<Array<IndexedAccount>> {
    const updatedAccounts: Array<IndexedAccount> = [];

    for (const indexedAccount of indexedAccounts) {
      const latestTx = await this.btcRawData
        .find({ address: indexedAccount.address }, { sort: { timestamp: -1 } })
        .limit(1)
        .toArray();

      let txToStartFrom = '';
      if (latestTx != null && latestTx.length > 0) {
        txToStartFrom = latestTx[0].id;
      }

      const newTxs = await this.fetchTransactions(indexedAccount.address, txToStartFrom);
      const parsedTxs = newTxs.map(this.parseToTransaction);
      await this.btcRawData.insertMany(parsedTxs);

      updatedAccounts.push({
        address: indexedAccount.address,
        txIds: newTxs.map(tx => tx.txid),
        lastUpdated: indexedAccount.lastUpdated,
      } as IndexedAccount);
    }

    return updatedAccounts;
  }
}
