import axios from "axios";
import { IExplorerDataSupplicant } from "../interfaces/IExplorerDataSupplicant";
import { Collection } from "mongodb";
import { Transaction } from '../models/Transaction';
import { IndexService } from '../indexService';
import { AccountTxMap, IndexedAccount } from '../models/IndexedAccount';

// this adapter fetches btc data
export class MempoolSpaceAdapter implements IExplorerDataSupplicant {
  coin: string = 'btc';
  btcRawData: Collection<Transaction>;

  constructor(btcRawData: Collection<Transaction>) {
    this.btcRawData = btcRawData;
  }

  // Function to recursively fetch all pages of data
  async fetchAllData(walletAddress: string, txToStartFrom: string = ''): Promise<any[]> {
    const limit = 25; // max number of items a request may contain, specified by the api
    let allData: any[] = [];
    let moreDataAvailable = true;
    let lastTxId = txToStartFrom || '';

    while (moreDataAvailable) {
      try {
        const response = await axios.get(`https://mempool.space/api/address/${walletAddress}/txs&after_txid=${lastTxId}`);
        const newData = response.data;
        allData = allData.concat(newData.data); // Assuming the data is in the `data` field

        // Check if we received fewer items than we requested, indicating we've reached the end
        if (newData.data.length < limit) {
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

    for (let indexedAccount of indexedAccounts) {
      // get the latest tx from the api and check if it exists in the db
      const latestTxs = await this.fetchAllData(indexedAccount.address);
      const latestTxid = latestTxs[0].txid;
      const result = this.btcRawData.findOne({ txid: latestTxid });

      // if it doesnt exist the address needs to be updated
      if (result === null) {
        addressesToUpdate.push(indexedAccount);
      }
    }

    return addressesToUpdate;
  }

  async updateState(indexedAccounts: Array<IndexedAccount>): Promise<Array<IndexedAccount>> {
    const updatedAccounts: Array<IndexedAccount> = [];

    for (let indexedAccount of indexedAccounts) {
      const latestTx = await this.btcRawData.find({ address: indexedAccount.address }, { sort: { timestamp: -1 } }).limit(1).toArray();

      let txToStartFrom = '';
      if (latestTx != null && latestTx.length > 0) {
        txToStartFrom = latestTx[0].id;
      }

      const newTxs = await this.fetchAllData(indexedAccount.address, txToStartFrom);
      this.btcRawData.insertMany(newTxs);

      updatedAccounts.push({ address: indexedAccount.address, txIds: newTxs.map(tx => tx.txid), lastUpdated: indexedAccount.lastUpdated} as IndexedAccount);
    }

    return updatedAccounts;
  }
}