import { Collection } from "mongodb"
import { Transaction } from "../models/Transaction"
import { IndexedAccount } from "../models/IndexedAccount"
import { IExplorerDataSupplicant } from "../interfaces/IExplorerDataSupplicant"
import { IDataService } from "../interfaces/IDataService"
import { AggregatedAccountBalance } from "../models/AggregatedAccountBalance"
import { IndexService } from "../indexService"

// basically pipes through values, from a simple btc tx we cannot simply infer relationships to other chains
export class BtcDataService implements IDataService {
    btcRawData: Collection<Transaction>
    btcIndexData: Collection<IndexedAccount>
    apiAdapter: IExplorerDataSupplicant
    indexService: IndexService

    constructor(
            btcRawData: Collection<Transaction>, 
            btcIndexData: Collection<IndexedAccount>, 
            apiAdapter: IExplorerDataSupplicant,
            indexService: IndexService) {
        this.btcRawData = btcRawData
        this.btcIndexData = btcIndexData
        this.apiAdapter = apiAdapter
        this.indexService = indexService
    }
    async getTransaction(txId: string): Promise<Transaction | null> {
        return await this.btcRawData.findOne({txIds: txId}) as Transaction | null;
    }

    async getAccountHistory(address: string): Promise<Array<Transaction>> {
        return await this.btcRawData.find({address: address}).toArray();
    }

    async getBalanceHistory(address: string): Promise<AggregatedAccountBalance> {
        throw new Error("Method not implemented.")
    }
}